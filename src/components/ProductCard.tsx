import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Eye } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';

// Import generated images
import ghagra1 from '@/assets/ghagra-1.jpg';
import ghagra2 from '@/assets/ghagra-2.jpg';
import ghagra3 from '@/assets/ghagra-3.jpg';
import jewelry1 from '@/assets/jewelry-1.jpg';
import jewelry2 from '@/assets/jewelry-2.jpg';
import jewelry3 from '@/assets/jewelry-3.jpg';
import ghagra_yellow from '@/assets/ghagra_yellow.jpg'

// Image mapping for proper display
const imageMap: Record<string, string> = {
  'ghagra-1.jpg': ghagra1,
  'ghagra-2.jpg': ghagra2,
  'ghagra-3.jpg': ghagra3,
  'jewelry-1.jpg': jewelry1,
  'jewelry-2.jpg': jewelry2,
  'jewelry-3.jpg': jewelry3,
  'ghagra_yellow': ghagra_yellow,
};

interface ProductCardProps {
  id: string;
  name: string;
  category: 'GHAGRA' | 'JEWELLERY';
  image: string;
  available: boolean;
  hoverImage?: string;
  color?: string;
  price?: number;
}

export const ProductCard = ({ 
  id, 
  name, 
  category, 
  image, 
  available, 
  hoverImage,
  color,
  price 
}: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { isFavorite, toggle } = useWishlist();
  const isFavorited = isFavorite(id);

  return (
    <div 
      className="group relative glass-card overflow-hidden rounded-lg hover-lift transition-luxury"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${id}`}>
        <div className="aspect-[4/5] overflow-hidden">
          <img
            src={imageMap[isHovered && hoverImage ? hoverImage : image] || image || '/placeholder.svg'}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </Link>

      {/* Action Buttons */}
      <div className="absolute top-3 left-3 right-3 flex justify-between">
        <Button
          variant="glass"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Eye className="w-4 h-4" />
        </Button>
        <Button
          variant="glass"
          size="icon"
          onClick={() => toggle(id)}
          aria-label={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`transition-colors ${isFavorited ? 'text-destructive' : ''}`}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
        </Button>
      </div>

      {/* Availability Badge */}
      <div className="absolute top-3 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${available ? 'bg-success' : 'bg-muted-foreground'}`} />
          <span className={`text-xs px-2 py-1 rounded-full backdrop-blur-sm ${
            available 
              ? 'bg-success/20 text-success' 
              : 'bg-muted/20 text-muted-foreground'
          }`}>
            {available ? 'Available' : 'Booked'}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge 
            variant="outline" 
            className="text-xs text-primary border-primary/30"
          >
            {category}
          </Badge>
          {color && (
            <Badge variant="secondary" className="text-xs">
              {color}
            </Badge>
          )}
        </div>
        
        <h3 className="font-display font-semibold text-foreground mb-2 line-clamp-2">
          {name}
        </h3>
        
        {price && (
          <p className="text-lg font-semibold text-primary mb-3">
            ₹{price.toLocaleString()}
          </p>
        )}
        
        {/* View Product CTA - appears on hover */}
        <Link to={`/product/${id}`}>
          <Button 
            variant="hero" 
            className="w-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            View Product
          </Button>
        </Link>
      </div>
    </div>
  );
};