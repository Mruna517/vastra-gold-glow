-- =====================================================================
-- Admin / user split + advance payment on approved bookings
--
-- >>> EDIT THE EMAIL BELOW if your single admin account uses a different one <<<
-- The admin account itself (email + password) must already exist in
-- Supabase -> Authentication -> Users.
-- =====================================================================

-- 1) Advance payment column on bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS advance_amount NUMERIC(10,2);

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_advance_nonnegative;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_advance_nonnegative
  CHECK (advance_amount IS NULL OR advance_amount >= 0);

-- Newly approved bookings must carry an advance amount
-- (NOT VALID = existing accepted rows are left alone)
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_accepted_needs_advance;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_accepted_needs_advance
  CHECK (status <> 'accepted' OR advance_amount IS NOT NULL) NOT VALID;

-- 2) Exactly ONE admin: the email below
UPDATE public.profiles SET is_admin = false WHERE is_admin = true;

UPDATE public.profiles
SET is_admin = true
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@vastraveda.com');

DROP INDEX IF EXISTS public.only_one_admin;
CREATE UNIQUE INDEX only_one_admin ON public.profiles ((true)) WHERE is_admin;

-- 3) Nobody can promote themselves to admin through the API
CREATE OR REPLACE FUNCTION public.guard_profile_admin_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin AND auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'is_admin cannot be changed from the client';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_admin_flag ON public.profiles;
CREATE TRIGGER trg_guard_profile_admin_flag
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_admin_flag();

-- 4) Customers can only create PENDING bookings with no advance
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
CREATE POLICY "Users can create their own bookings"
ON public.bookings FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
  AND advance_amount IS NULL
);

-- 5) Customers can only cancel their own pending booking. They cannot
--    approve, edit the advance, or change anything else. Admin can do all.
CREATE OR REPLACE FUNCTION public.guard_booking_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id        IS DISTINCT FROM OLD.user_id
  OR NEW.product_id     IS DISTINCT FROM OLD.product_id
  OR NEW.booking_date   IS DISTINCT FROM OLD.booking_date
  OR NEW.time_slot      IS DISTINCT FROM OLD.time_slot
  OR NEW.advance_amount IS DISTINCT FROM OLD.advance_amount THEN
    RAISE EXCEPTION 'Not allowed to change this booking';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT (OLD.status = 'pending' AND NEW.status = 'cancelled') THEN
    RAISE EXCEPTION 'Only a pending booking can be cancelled by the customer';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_booking_updates ON public.bookings;
CREATE TRIGGER trg_guard_booking_updates
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.guard_booking_updates();
