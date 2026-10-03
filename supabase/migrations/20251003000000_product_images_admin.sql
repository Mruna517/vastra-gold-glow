-- =====================================================================
-- Product photos: let ONLY the admin upload/replace/delete images and
-- products. (The original storage policies allowed any logged-in user.)
-- =====================================================================

-- Storage bucket (safe to re-run)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND public.is_admin(auth.uid()));

-- Admin can delete products (insert/update policies already exist)
DROP POLICY IF EXISTS "Only admins can delete products" ON public.products;
CREATE POLICY "Only admins can delete products"
ON public.products FOR DELETE
USING (public.is_admin(auth.uid()));
