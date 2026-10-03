-- =====================================================================
-- Wishlist (heart) + Notifications (bell)
-- =====================================================================

-- 1) Wishlist ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own wishlist" ON public.wishlists;
CREATE POLICY "Users view own wishlist"
ON public.wishlists FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users add to own wishlist" ON public.wishlists;
CREATE POLICY "Users add to own wishlist"
ON public.wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users remove from own wishlist" ON public.wishlists;
CREATE POLICY "Users remove from own wishlist"
ON public.wishlists FOR DELETE USING (auth.uid() = user_id);

-- 2) Notifications -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications"
ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications"
ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own notifications" ON public.notifications;
CREATE POLICY "Users delete own notifications"
ON public.notifications FOR DELETE USING (auth.uid() = user_id);
-- No INSERT policy on purpose: only the triggers below create notifications.

-- 3) Triggers on bookings ---------------------------------------------
-- New booking request -> notify the admin
CREATE OR REPLACE FUNCTION public.notify_admin_new_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prod_name TEXT;
  cust_name TEXT;
BEGIN
  SELECT name INTO prod_name FROM public.products WHERE id = NEW.product_id;
  SELECT name INTO cust_name FROM public.profiles WHERE user_id = NEW.user_id;

  INSERT INTO public.notifications (user_id, title, message, link)
  SELECT p.user_id,
         'New booking request',
         COALESCE(cust_name, 'A customer') || ' requested ' || COALESCE(prod_name, 'an item')
           || ' for ' || to_char(NEW.booking_date, 'DD Mon YYYY') || ' (' || NEW.time_slot || ')',
         '/admin/dashboard'
  FROM public.profiles p
  WHERE p.is_admin = true;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admin_new_booking ON public.bookings;
CREATE TRIGGER trg_notify_admin_new_booking
AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_booking();

-- Status change -> notify the customer
CREATE OR REPLACE FUNCTION public.notify_user_booking_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prod_name TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT name INTO prod_name FROM public.products WHERE id = NEW.product_id;

    IF NEW.status = 'accepted' THEN
      INSERT INTO public.notifications (user_id, title, message, link)
      VALUES (
        NEW.user_id,
        'Booking approved',
        'Your booking for ' || COALESCE(prod_name, 'an item') || ' on '
          || to_char(NEW.booking_date, 'DD Mon YYYY') || ' was approved.'
          || CASE WHEN NEW.advance_amount IS NOT NULL
                  THEN ' Advance to pay: Rs. ' || NEW.advance_amount::text
                  ELSE '' END,
        '/my-bookings'
      );
    ELSIF NEW.status = 'cancelled' THEN
      IF COALESCE(public.is_admin(auth.uid()), false) THEN
        -- cancelled by the admin -> tell the customer
        INSERT INTO public.notifications (user_id, title, message, link)
        VALUES (
          NEW.user_id,
          'Booking cancelled',
          'Your booking for ' || COALESCE(prod_name, 'an item') || ' on '
            || to_char(NEW.booking_date, 'DD Mon YYYY') || ' was cancelled.',
          '/my-bookings'
        );
      ELSE
        -- cancelled by the customer -> tell the admin
        INSERT INTO public.notifications (user_id, title, message, link)
        SELECT p.user_id,
               'Booking cancelled by customer',
               COALESCE(prod_name, 'An item') || ' on '
                 || to_char(NEW.booking_date, 'DD Mon YYYY') || ' (' || NEW.time_slot || ') was cancelled.',
               '/admin/dashboard'
        FROM public.profiles p
        WHERE p.is_admin = true;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_user_booking_status ON public.bookings;
CREATE TRIGGER trg_notify_user_booking_status
AFTER UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_user_booking_status();

-- 4) Realtime so the bell updates instantly ---------------------------
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;
