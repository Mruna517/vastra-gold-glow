import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  Upload, 
  CheckCircle, 
  Eye, 
  X, 
  Settings, 
  LogOut,
  Calendar,
  User,
  MessageSquare 
} from 'lucide-react';

interface Booking {
  id: string;
  userName: string;
  college: string;
  productName: string;
  date: string;
  slot: string;
  status: 'Pending' | 'Accepted' | 'Cancelled';
}

const AdminDashboard = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: '1',
      userName: 'Priya Shah',
      college: 'R C Patel (Engineering)',
      productName: 'Royal Golden Ghagra',
      date: '2024-09-25',
      slot: 'Evening (5-8 PM)',
      status: 'Pending'
    },
    {
      id: '2',
      userName: 'Anita Patel',
      college: 'NIMMS',
      productName: 'Diamond Necklace Set',
      date: '2024-09-28',
      slot: 'Afternoon (12-5 PM)',
      status: 'Pending'
    }
  ]);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin');
    }
  }, [isAdmin, navigate]);

  const handleAcceptBooking = (bookingId: string) => {
    setBookings(prev => 
      prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'Accepted' as const }
          : booking
      )
    );
    toast({
      title: "Booking accepted",
      description: "Customer will be notified"
    });
  };

  const handleDeclineBooking = (bookingId: string) => {
    setBookings(prev => 
      prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'Cancelled' as const }
          : booking
      )
    );
    toast({
      title: "Booking declined",
      description: "Customer will be notified"
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const stats = {
    pendingBookings: bookings.filter(b => b.status === 'Pending').length,
    confirmedBookings: bookings.filter(b => b.status === 'Accepted').length,
    photosUploaded: 24,
    topViewed: 'Royal Golden Ghagra'
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-display font-bold text-primary">Vastraveda</h1>
            <p className="text-sm text-muted-foreground">Admin Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="confirm" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Confirm
            </TabsTrigger>
            <TabsTrigger value="view" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              View
            </TabsTrigger>
            <TabsTrigger value="cancel" className="flex items-center gap-2">
              <X className="w-4 h-4" />
              Cancel
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Overview */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pending Bookings
                  </CardTitle>
                  <div className="text-2xl font-bold text-warning">
                    {stats.pendingBookings}
                  </div>
                </CardHeader>
              </Card>
              
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Confirmed Bookings
                  </CardTitle>
                  <div className="text-2xl font-bold text-success">
                    {stats.confirmedBookings}
                  </div>
                </CardHeader>
              </Card>
              
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Photos This Week
                  </CardTitle>
                  <div className="text-2xl font-bold text-info">
                    {stats.photosUploaded}
                  </div>
                </CardHeader>
              </Card>
              
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Top Viewed
                  </CardTitle>
                  <div className="text-sm font-semibold text-primary">
                    {stats.topViewed}
                  </div>
                </CardHeader>
              </Card>
            </div>
          </TabsContent>

          {/* Confirm Bookings */}
          <TabsContent value="confirm" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-display">Pending Booking Requests</CardTitle>
                <CardDescription>Review and approve booking requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookings.filter(b => b.status === 'Pending').map(booking => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border border-border rounded-lg glass-card">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-semibold text-foreground">{booking.userName}</p>
                            <p className="text-sm text-muted-foreground">{booking.college}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(booking.date).toLocaleDateString()}
                          </span>
                          <span>{booking.slot}</span>
                          <span className="font-medium text-foreground">{booking.productName}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleAcceptBooking(booking.id)}
                        >
                          Accept
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeclineBooking(booking.id)}
                        >
                          Decline
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {bookings.filter(b => b.status === 'Pending').length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No pending bookings
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* View All Bookings */}
          <TabsContent value="view" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-display">All Bookings</CardTitle>
                <CardDescription>Complete booking history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookings.map(booking => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border border-border rounded-lg glass-card">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-semibold text-foreground">{booking.userName}</p>
                            <p className="text-sm text-muted-foreground">{booking.college}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(booking.date).toLocaleDateString()}
                          </span>
                          <span>{booking.slot}</span>
                          <span className="font-medium text-foreground">{booking.productName}</span>
                        </div>
                      </div>
                      <Badge 
                        variant={
                          booking.status === 'Accepted' ? 'default' : 
                          booking.status === 'Pending' ? 'secondary' : 'destructive'
                        }
                      >
                        {booking.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upload Images */}
          <TabsContent value="upload" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-display">Upload Product Images</CardTitle>
                <CardDescription>Add new ghagra and jewellery to the collection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg mb-2">Drag & drop images here</p>
                  <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                  <Button variant="outline">Select Files</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cancel">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-display">Cancel Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Booking cancellation interface</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-display">Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Admin settings and configuration</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
