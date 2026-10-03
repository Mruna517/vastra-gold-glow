import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Review {
  id: string;
  rating: number;
  comment: string;
  image_url?: string;
  created_at: string;
  profiles: {
    name: string;
  };
}

interface ReviewsSectionProps {
  productId: string;
}

export const ReviewsSection = ({ productId }: ReviewsSectionProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    // Manually fetch user names for each review
    const enrichedReviews = await Promise.all(
      (data || []).map(async (review: any) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('user_id', review.user_id)
          .single();

        return {
          ...review,
          profiles: profile || { name: 'Anonymous' }
        };
      })
    );

    setReviews(enrichedReviews as Review[]);
  };

  const submitReview = async () => {
    if (!isAuthenticated || newRating === 0) return;

    const { error } = await supabase
      .from('reviews')
      .insert({
        product_id: productId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        rating: newRating,
        comment: newComment
      });

    if (!error) {
      toast({ title: 'Review submitted successfully!' });
      setNewRating(0);
      setNewComment('');
      fetchReviews();
    }
  };

  const renderStars = (rating: number, interactive = false) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} ${
          interactive ? 'cursor-pointer' : ''
        }`}
        onClick={interactive ? () => setNewRating(i + 1) : undefined}
      />
    ));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reviews ({reviews.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAuthenticated && (
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-semibold">Write a Review</h4>
            <div className="flex items-center gap-2">
              <span>Rating:</span>
              <div className="flex">{renderStars(newRating, true)}</div>
            </div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your experience..."
              className="w-full p-2 border rounded"
              rows={3}
            />
            <Button onClick={submitReview} disabled={newRating === 0}>
              Submit Review
            </Button>
          </div>
        )}

        {reviews.map((review) => (
          <div key={review.id} className="border-b pb-4 last:border-0">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{review.profiles?.name || 'Anonymous'}</span>
              <div className="flex items-center gap-2">
                <div className="flex">{renderStars(review.rating)}</div>
                <span className="text-sm text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            {review.comment && <p className="text-sm">{review.comment}</p>}
          </div>
        ))}

        {reviews.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No reviews yet. Be the first to review this product!
          </p>
        )}
      </CardContent>
    </Card>
  );
};