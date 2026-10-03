-- 1) Ensure the intended admin user has admin privileges
UPDATE public.profiles
SET is_admin = true
WHERE user_id = '6c36fd43-85a7-470d-83d0-5275bbee6c5f';

-- 2) Fix restrictive RLS policies on bookings so admins can see and manage all bookings
-- Drop existing SELECT/UPDATE policies to avoid restrictive AND behavior
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update any booking" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;

-- Recreate PERMISSIVE policies using a single OR condition per command
CREATE POLICY "Bookings selectable by admin or owner"
ON public.bookings
FOR SELECT
USING (
  public.is_admin(auth.uid()) OR auth.uid() = user_id
);

CREATE POLICY "Bookings updatable by admin or owner"
ON public.bookings
FOR UPDATE
USING (
  public.is_admin(auth.uid()) OR auth.uid() = user_id
)
WITH CHECK (
  public.is_admin(auth.uid()) OR auth.uid() = user_id
);
