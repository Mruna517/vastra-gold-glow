import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { User, Mail, Phone, MapPin, GraduationCap } from 'lucide-react';

const Profile = () => {
  const { user, login, register, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('demo@vastraveda.com');
  const [loginPassword, setLoginPassword] = useState('password');
  
  // Registration form state
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    address: '',
    college: ''
  });
  
  const [loading, setLoading] = useState(false);

  const colleges = [
    'R C Patel (Engineering)',
    'NIMMS',
    'R C Patel (Pharmacy)',
    'R C Patel (Polytechnic)',
    'Other'
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await login(loginEmail, loginPassword);
      if (result.success) {
        toast({
          title: "Login successful",
          description: "Welcome back!"
        });
        navigate(result.isAdmin ? '/admin/dashboard' : '/');
      } else {
        toast({
          title: "Login failed",
          description: result.error || "Invalid credentials",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await register(regForm);
      if (result.success) {
        toast({
          title: "Registration successful",
          description: "Please check your email to verify your account!"
        });
        navigate('/');
      } else {
        toast({
          title: "Registration failed",
          description: result.error || "Something went wrong",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Registration failed",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out successfully"
    });
    navigate('/');
  };

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-2xl font-display text-foreground">
                  Profile
                </CardTitle>
                <CardDescription>
                  Your account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">{user.name}</p>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">{user.email}</p>
                      <p className="text-sm text-muted-foreground">Email Address</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">{user.mobile}</p>
                      <p className="text-sm text-muted-foreground">Mobile Number</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">{user.college}</p>
                      <p className="text-sm text-muted-foreground">College</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">{user.address}</p>
                      <p className="text-sm text-muted-foreground">Address</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button variant="outline" onClick={() => navigate('/my-bookings')}>
                    My Bookings
                  </Button>
                  <Button variant="outline" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card className="glass-card">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-display text-primary">
                Vastraveda
              </CardTitle>
              <CardDescription>
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        className="glass-card"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="glass-card"
                      />
                    </div>
                    <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-name">Full Name</Label>
                      <Input
                        id="reg-name"
                        type="text"
                        value={regForm.name}
                        onChange={(e) => setRegForm({...regForm, name: e.target.value})}
                        required
                        className="glass-card"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input
                        id="reg-email"
                        type="email"
                        value={regForm.email}
                        onChange={(e) => setRegForm({...regForm, email: e.target.value})}
                        required
                        className="glass-card"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <Input
                        id="reg-password"
                        type="password"
                        value={regForm.password || ''}
                        onChange={(e) => setRegForm({...regForm, password: e.target.value})}
                        required
                        className="glass-card"
                        minLength={6}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reg-mobile">Mobile Number</Label>
                      <Input
                        id="reg-mobile"
                        type="tel"
                        value={regForm.mobile}
                        onChange={(e) => setRegForm({...regForm, mobile: e.target.value})}
                        required
                        className="glass-card"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reg-college">College</Label>
                      <Select value={regForm.college} onValueChange={(value) => setRegForm({...regForm, college: value})}>
                        <SelectTrigger className="glass-card">
                          <SelectValue placeholder="Select your college" />
                        </SelectTrigger>
                        <SelectContent>
                          {colleges.map(college => (
                            <SelectItem key={college} value={college}>
                              {college}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reg-address">Address</Label>
                      <Textarea
                        id="reg-address"
                        value={regForm.address}
                        onChange={(e) => setRegForm({...regForm, address: e.target.value})}
                        required
                        className="glass-card"
                      />
                    </div>
                    
                    <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                      {loading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;