-- Update product image URLs to use proper import paths
UPDATE products 
SET image_url = CASE 
  WHEN image_url = '/src/assets/ghagra-1.jpg' THEN 'ghagra-1.jpg'
  WHEN image_url = '/src/assets/ghagra-2.jpg' THEN 'ghagra-2.jpg'
  WHEN image_url = '/src/assets/ghagra-3.jpg' THEN 'ghagra-3.jpg'
  WHEN image_url = '/src/assets/jewelry-1.jpg' THEN 'jewelry-1.jpg'
  WHEN image_url = '/src/assets/jewelry-2.jpg' THEN 'jewelry-2.jpg'
  WHEN image_url = '/src/assets/jewelry-3.jpg' THEN 'jewelry-3.jpg'
  ELSE image_url
END;