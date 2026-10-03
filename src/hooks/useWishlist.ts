import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useWishlist = () => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryKey = ['wishlist', user?.user_id];

  const { data: ids = [] } = useQuery({
    queryKey,
    enabled: isAuthenticated && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wishlists')
        .select('product_id')
        .eq('user_id', user!.user_id);
      if (error) throw error;
      return (data ?? []).map(r => r.product_id);
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ productId, add }: { productId: string; add: boolean }) => {
      if (add) {
        const { error } = await supabase
          .from('wishlists')
          .insert({ user_id: user!.user_id, product_id: productId });
        if (error && error.code !== '23505') throw error; // ignore duplicate
      } else {
        const { error } = await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', user!.user_id)
          .eq('product_id', productId);
        if (error) throw error;
      }
    },
    onMutate: async ({ productId, add }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<string[]>(queryKey) ?? [];
      queryClient.setQueryData<string[]>(
        queryKey,
        add ? [...previous, productId] : previous.filter(id => id !== productId)
      );
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      queryClient.setQueryData(queryKey, ctx?.previous ?? []);
      toast({
        title: 'Could not update wishlist',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['wishlist-products'] });
    },
  });

  const isFavorite = (productId: string) => ids.includes(productId);

  const toggle = (productId: string) => {
    if (!isAuthenticated || !user) {
      toast({ title: 'Please log in', description: 'Log in to save items to your wishlist.' });
      navigate('/profile');
      return;
    }
    mutation.mutate({ productId, add: !isFavorite(productId) });
  };

  return { ids, count: ids.length, isFavorite, toggle };
};
