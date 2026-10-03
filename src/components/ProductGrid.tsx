import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X } from 'lucide-react';
import { useProducts, ProductFilters } from '@/hooks/useProducts';
import { ProductCard } from './ProductCard';
import { FILTER_NOTE } from '@/config/siteNotes';

export const ProductGrid = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>({});
  const { products, loading, error } = useProducts(filters);

  const handleColorFilter = (color: string) => {
    setFilters(prev => ({ ...prev, color: color === 'all' ? undefined : color }));
  };

  const handlePriceFilter = (priceRange: string) => {
    if (priceRange === 'all') {
      setFilters(prev => ({ ...prev, priceRange: undefined }));
    } else {
      const [min, max] = priceRange.split('-').map(Number);
      setFilters(prev => ({ ...prev, priceRange: [min, max] }));
    }
  };

  const clearFilters = () => {
    setFilters({});
  };

  const activeFiltersCount = Object.keys(filters).filter(key => filters[key as keyof ProductFilters] !== undefined).length;

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-80 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-destructive mb-4">Error: {error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Toggle */}
      <div className="grid grid-cols-2 md:grid-cols-[1fr_auto_1fr] items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
        <p className="order-last col-span-2 md:order-none md:col-span-1 text-center text-xs sm:text-sm font-medium text-success">{FILTER_NOTE}</p>
        <p className="text-sm text-muted-foreground text-right">
          {products.length} product{products.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Color Filter */}
              <div className="space-y-2">
                <Label>Color</Label>
                <Select onValueChange={handleColorFilter} value={filters.color || 'all'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Colors</SelectItem>
                    <SelectItem value="Golden">Golden</SelectItem>
                    <SelectItem value="Red">Red</SelectItem>
                    <SelectItem value="Pink">Pink</SelectItem>
                    <SelectItem value="Silver">Silver</SelectItem>
                    <SelectItem value="Green">Green</SelectItem>
                    <SelectItem value="White">White</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Filter */}
              <div className="space-y-2">
                <Label>Price Range</Label>
                <Select onValueChange={handlePriceFilter} value={
                  filters.priceRange ? `${filters.priceRange[0]}-${filters.priceRange[1]}` : 'all'
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select price range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="600-700">₹600 - ₹700</SelectItem>
                    <SelectItem value="700-800">₹700 - ₹800</SelectItem>
                    <SelectItem value="800-900">₹800 - ₹900</SelectItem>
                    <SelectItem value="900-1000">₹900 - ₹1,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, category: value === 'all' ? undefined : value as 'GHAGRA' | 'JEWELLERY' }))
                } value={filters.category || 'all'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="GHAGRA">Ghagra</SelectItem>
                    <SelectItem value="JEWELLERY">Jewellery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl text-muted-foreground mb-4">No products found</p>
          <p className="text-muted-foreground">Try adjusting your filters or browse all categories</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
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
    </div>
  );
};