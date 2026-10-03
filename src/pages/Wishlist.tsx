import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/hooks/useWishlist';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '@/hooks/useProducts';

const Wishlist = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { ids } = useWishlist();

  useEffect(() => {
    if (!isAuthenticated) navigate('/profile');
  }, [isAuthenticated, navigate]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['wishlist-products', ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').in('id', ids);
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-display font-bold text-foreground mb-6">My Wishlist</h1>

        {ids.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">You haven't saved anything yet.</p>
            <Button variant="hero" onClick={() => navigate('/')}>Browse collection</Button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {ids.map(id => <div key={id} className="h-80 bg-muted rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.filter(p => ids.includes(p.id)).map(product => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                category={product.category}
                image={product.image_url}
                hoverImage={product.image_url}
                available={product.available}
                color={product.color}
                price={product.price}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Wishlist;
