-- Add is_admin flag to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Helper function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE user_id = uid), false);
$$;

-- Tighten product policies to admins only
DROP POLICY IF EXISTS "Only admins can insert products" ON public.products;
CREATE POLICY "Only admins can insert products"
ON public.products
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Only admins can update products" ON public.products;
CREATE POLICY "Only admins can update products"
ON public.products
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Restrict product availability management to admins only, keep public read
DROP POLICY IF EXISTS "Only admins can manage product availability" ON public.product_availability;
CREATE POLICY "Only admins can manage product availability"
ON public.product_availability
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Admin policies for bookings to view/update all
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
CREATE POLICY "Admins can view all bookings"
ON public.bookings
FOR SELECT
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update any booking" ON public.bookings;
CREATE POLICY "Admins can update any booking"
ON public.bookings
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Ensure uniqueness for availability rows per product/date/slot
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_availability_unique'
  ) THEN
    ALTER TABLE public.product_availability
    ADD CONSTRAINT product_availability_unique UNIQUE (product_id, availability_date, time_slot);
  END IF;
END $$;

-- Trigger to sync availability when booking status changes
CREATE OR REPLACE FUNCTION public.sync_availability_on_booking_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
      INSERT INTO public.product_availability (product_id, availability_date, time_slot, is_booked, booking_id)
      VALUES (NEW.product_id, NEW.booking_date, COALESCE(NEW.time_slot, 'Full Day'), true, NEW.id)
      ON CONFLICT (product_id, availability_date, time_slot)
      DO UPDATE SET is_booked = true, booking_id = NEW.id;
    ELSIF NEW.status IN ('cancelled','rejected') AND OLD.status = 'accepted' THEN
      UPDATE public.product_availability
      SET is_booked = false, booking_id = NULL
      WHERE product_id = NEW.product_id
        AND availability_date = NEW.booking_date
        AND time_slot = COALESCE(NEW.time_slot, 'Full Day');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_availability_on_booking_update ON public.bookings;
CREATE TRIGGER trg_sync_availability_on_booking_update
AFTER UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.sync_availability_on_booking_update();