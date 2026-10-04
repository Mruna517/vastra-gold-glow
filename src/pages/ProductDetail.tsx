import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useWishlist } from '@/hooks/useWishlist';
import { toLocalDateString, startOfToday } from '@/lib/dates';
import { Heart, Eye, ArrowLeft, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/hooks/useProducts';
import { useBookedDates } from '@/hooks/useBookedDates';

// Import generated images
import ghagra1 from '@/assets/ghagra-1.jpg';
import ghagra2 from '@/assets/ghagra-2.jpg';
import ghagra3 from '@/assets/ghagra-3.jpg';
import jewelry1 from '@/assets/jewelry-1.jpg';
import jewelry2 from '@/assets/jewelry-2.jpg';
import jewelry3 from '@/assets/jewelry-3.jpg';

// Image mapping for proper display
const imageMap: Record<string, string> = {
  'ghagra-1.jpg': ghagra1,
  'ghagra-2.jpg': ghagra2,
  'ghagra-3.jpg': ghagra3,
  'jewelry-1.jpg': jewelry1,
  'jewelry-2.jpg': jewelry2,
  'jewelry-3.jpg': jewelry3,
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isFavorite, toggle } = useWishlist();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Use booked dates hook
  const { bookedDates, isDateBooked, isDateFullyBooked } = useBookedDates(id || '');

  // Only today and later can be booked
  const today = startOfToday();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        setProduct(data as Product);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="h-96 bg-muted rounded-lg animate-pulse" />
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h1 className="text-2xl font-semibold text-foreground mb-4">Product Not Found</h1>
            <Button onClick={() => navigate('/')}>Back to Gallery</Button>
          </div>
        </main>
      </div>
    );
  }

  const handleBookingRequest = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    if (!selectedDate) {
      toast({
        title: "Please select a date",
        variant: "destructive"
      });
      return;
    }
    setShowBookingModal(true);
  };

  const confirmBooking = async () => {
    if (!selectedDate || !user || !id) return;

    try {
      console.log('Creating booking with user_id:', user.user_id);
      const { error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.user_id,
          product_id: id,
          booking_date: toLocalDateString(selectedDate),
          time_slot: 'Full Day',
          status: 'pending'
        });

      if (error) {
        console.error('Booking insert error:', error);
        throw error;
      }

      toast({
        title: "Booking request sent",
        description: "You'll receive confirmation after admin approval."
      });
      
      setShowBookingModal(false);
      navigate('/my-bookings');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Error",
        description: "Failed to submit booking request",
        variant: "destructive"
      });
    }
  };

  

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Gallery
        </Button>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative group">
              <img
                src={imageMap[product.image_url] || product.image_url || '/placeholder.svg'}
                alt={product.name}
                className="w-full h-[600px] object-cover rounded-lg glass-card"
              />
              <Button
                variant="glass"
                size="icon"
                className={`absolute top-4 right-4 ${isFavorite(product.id) ? 'text-destructive' : ''}`}
                onClick={() => toggle(product.id)}
                aria-label="Toggle wishlist"
              >
                <Heart className={`w-5 h-5 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="glass"
                size="icon"
                className="absolute top-4 left-4"
              >
                <Eye className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Product Info & Booking */}
          <div className="space-y-8">
            <div>
              <Badge variant="outline" className="mb-4 text-primary border-primary">
                {product.category}
              </Badge>
              <h1 className="text-4xl font-display font-bold text-foreground mb-4">
                {product.name}
              </h1>
              <div className="space-y-4">
                <div>
                  <span className="font-semibold text-foreground">Price: </span>
                  <span className="text-2xl font-bold text-primary">₹{product.price.toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-semibold text-foreground">Color: </span>
                  <Badge variant="secondary">{product.color}</Badge>
                </div>
                <div>
                  <span className="font-semibold text-foreground">Availability: </span>
                  <Badge variant={product.available ? "default" : "destructive"}>
                    {product.available ? "Available" : "Currently Booked"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Booking Panel */}
            <Card className="glass-card p-6">
              <h3 className="text-xl font-display font-semibold mb-6 text-foreground">
                Availability & Book Slot
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3 text-foreground">
                    <CalendarIcon className="inline w-4 h-4 mr-2" />
                    Select Date
                  </label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    defaultMonth={today}
                    fromDate={today}
                    disabled={(date) => date < today || isDateFullyBooked(date)}
                    modifiers={{
                      booked: (date) => isDateFullyBooked(date)
                    }}
                    modifiersStyles={{
                      booked: {
                        backgroundColor: 'hsl(var(--destructive))',
                        color: 'hsl(var(--destructive-foreground))',
                        opacity: 0.6
                      }
                    }}
                    className="glass-card p-3 pointer-events-auto"
                  />
                </div>


                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={handleBookingRequest}
                  disabled={!selectedDate}
                >
                  Request Booking
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  You'll receive confirmation after admin approval
                </p>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Booking Confirmation Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="glass-surface border-primary/30">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Confirm Booking Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p><span className="font-semibold">Product:</span> {product.name}</p>
              <p><span className="font-semibold">Date:</span> {selectedDate?.toLocaleDateString()}</p>
              <p><span className="font-semibold">Contact:</span> {user?.name} ({user?.mobile})</p>
              <p><span className="font-semibold">College:</span> {user?.college}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="hero" onClick={confirmBooking}>
                Confirm Request
              </Button>
              <Button variant="outline" onClick={() => setShowBookingModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="glass-surface border-primary/30">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Login to Continue Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">You need to be logged in to book a slot.</p>
            <div className="flex gap-3">
              <Button variant="hero" onClick={() => navigate('/profile')}>
                Login / Register
              </Button>
              <Button variant="outline" onClick={() => setShowLoginModal(false)}>
                Continue as Guest (View Only)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDetail;
