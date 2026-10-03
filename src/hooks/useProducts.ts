import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  name: string;
  category: 'GHAGRA' | 'JEWELLERY';
  image_url: string;
  color: string;
  price: number;
  available: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductFilters {
  color?: string;
  priceRange?: [number, number];
  category?: 'GHAGRA' | 'JEWELLERY';
}

export const useProducts = (filters?: ProductFilters) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let query = supabase.from('products').select('*');

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.color) {
        query = query.eq('color', filters.color);
      }

      if (filters?.priceRange) {
        query = query.gte('price', filters.priceRange[0]).lte('price', filters.priceRange[1]);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setProducts((data as Product[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  return { products, loading, error, refetch: fetchProducts };
};