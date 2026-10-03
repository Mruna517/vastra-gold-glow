-- Create admin user if none exists
INSERT INTO public.profiles (user_id, name, is_admin)
SELECT auth.uid(), 'Admin User', true
WHERE auth.uid() IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE is_admin = true)
ON CONFLICT (user_id) DO UPDATE SET is_admin = true;