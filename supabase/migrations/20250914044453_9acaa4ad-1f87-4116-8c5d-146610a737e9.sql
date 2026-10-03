-- Update profiles RLS policy to allow admins to view all profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new policy that allows users to view their own profile OR admins to view all profiles
CREATE POLICY "Profiles viewable by owner or admin"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id OR public.is_admin(auth.uid())
);