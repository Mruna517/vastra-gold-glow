-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('GHAGRA', 'JEWELLERY')),
  image_url TEXT NOT NULL,
  color TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product_availability table for date-specific availability
CREATE TABLE public.product_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  availability_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  is_booked BOOLEAN NOT NULL DEFAULT false,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, availability_date, time_slot)
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_availability ENABLE ROW LEVEL SECURITY;

-- Create policies for products (public read, admin write)
CREATE POLICY "Products are viewable by everyone" 
ON public.products FOR SELECT USING (true);

CREATE POLICY "Only admins can insert products" 
ON public.products FOR INSERT 
WITH CHECK (auth.uid() IN (
  SELECT user_id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Only admins can update products" 
ON public.products FOR UPDATE 
USING (auth.uid() IN (
  SELECT user_id FROM public.profiles WHERE user_id = auth.uid()
));

-- Create policies for bookings
CREATE POLICY "Users can view their own bookings" 
ON public.bookings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" 
ON public.bookings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" 
ON public.bookings FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policies for reviews
CREATE POLICY "Reviews are viewable by everyone" 
ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Users can create their own reviews" 
ON public.reviews FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" 
ON public.reviews FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policies for product_availability
CREATE POLICY "Product availability is viewable by everyone" 
ON public.product_availability FOR SELECT USING (true);

CREATE POLICY "Only admins can manage product availability" 
ON public.product_availability FOR ALL 
USING (auth.uid() IN (
  SELECT user_id FROM public.profiles WHERE user_id = auth.uid()
));

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample products
INSERT INTO public.products (name, category, image_url, color, price) VALUES
('Royal Golden Ghagra', 'GHAGRA', '/src/assets/ghagra-1.jpg', 'Golden', 15000.00),
('Traditional Red Lehenga', 'GHAGRA', '/src/assets/ghagra-2.jpg', 'Red', 12000.00),
('Silk Pink Ghagra', 'GHAGRA', '/src/assets/ghagra-3.jpg', 'Pink', 13500.00),
('Diamond Necklace Set', 'JEWELLERY', '/src/assets/jewelry-1.jpg', 'Silver', 25000.00),
('Emerald Earrings', 'JEWELLERY', '/src/assets/jewelry-2.jpg', 'Green', 8000.00),
('Pearl Bracelet', 'JEWELLERY', '/src/assets/jewelry-3.jpg', 'White', 6000.00);