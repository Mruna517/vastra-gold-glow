import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, MessageSquare, X } from 'lucide-react';

interface UserBooking {
  id: string;
  product_id: string;
  booking_date: string;
  time_slot: string;
  status: 'pending' | 'accepted' | 'cancelled';
  advance_amount: number | null;
  created_at: string;
  products: {
    name: string;
    image_url: string;
  } | null;
}

const MyBookings = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/profile');
      return;
    }
    fetchBookings();
  }, [isAuthenticated, navigate, user]);

  const fetchBookings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          products (
            name,
            image_url
          )
        `)
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings((data as UserBooking[]) || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your bookings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'cancelled' as const }
            : booking
        )
      );

      toast({
        title: "Booking cancelled",
        description: "Your booking has been cancelled successfully."
      });
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive"
      });
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-display font-bold text-foreground mb-8">
            My Bookings
          </h1>

          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading your bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <Card className="glass-card text-center p-12">
              <CardContent className="space-y-4">
                <Calendar className="w-16 h-16 mx-auto text-muted-foreground" />
                <h3 className="text-xl font-semibold text-foreground">No bookings yet</h3>
                <p className="text-muted-foreground">Start browsing our collection to make your first booking</p>
                <Button variant="hero" onClick={() => navigate('/')}>
                  Browse Collection
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {bookings.map(booking => (
                <Card key={booking.id} className="glass-card hover-lift">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <img
                        src={booking.products?.image_url || '/placeholder.svg'}
                        alt={booking.products?.name || 'Product'}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-display font-semibold text-foreground">
                              {booking.products?.name || 'Unknown Product'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Requested on {new Date(booking.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge 
                            variant={
                              booking.status === 'accepted' ? 'default' : 
                              booking.status === 'pending' ? 'secondary' : 'destructive'
                            }
                            className={
                              booking.status === 'pending' ? 'bg-warning/20 text-warning border-warning/30' :
                              booking.status === 'accepted' ? 'bg-success/20 text-success border-success/30' :
                              'bg-destructive/20 text-destructive border-destructive/30'
                            }
                          >
                            {booking.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(booking.booking_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {booking.time_slot}
                          </span>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <Button variant="outline" size="sm">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Contact Admin
                          </Button>
                          
                          {booking.status === 'pending' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleCancelBooking(booking.id)}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancel Request
                            </Button>
                          )}
                          
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </div>

                        {booking.status === 'accepted' && (
                          <div className="mt-4 p-3 bg-success/10 border border-success/30 rounded-lg">
                            <p className="text-sm text-success font-medium">
                              ✓ Booking confirmed! Please arrive on time for your scheduled slot.
                            </p>
                            {booking.advance_amount !== null && (
                              <p className="text-sm text-success mt-1">
                                Advance paid: ₹{Number(booking.advance_amount).toLocaleString('en-IN')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyBookings;