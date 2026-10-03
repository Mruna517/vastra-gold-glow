import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  User, 
  Heart, 
  Menu, 
  X,
  Home,
  Calendar,
  UserCircle,
  LogOut,
  Search
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useWishlist } from '@/hooks/useWishlist';
import { NotificationBell } from '@/components/NotificationBell';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { count: wishlistCount } = useWishlist();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  // Admin sees the same bar, but with admin-only content
  if (isAdmin) {
    return (
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <Link to="/admin/dashboard" className="text-xl md:text-2xl font-display font-bold text-primary">
              Vastraveda
            </Link>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <span className="hidden sm:inline text-sm text-muted-foreground">Welcome, Admin</span>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await logout();
                  navigate('/admin');
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  if (isMobile) {
    return (
      <>
        {/* Mobile Top Bar */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Link to="/" className="text-xl font-display font-bold text-primary">
                Vastraveda
              </Link>
              <div className="flex items-center gap-3">
                <NotificationBell />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
              </div>
            </div>
            
            {/* Search bar */}
            <form onSubmit={handleSearch} className="mt-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ghagra, jewellery..."
                  className="pl-10 glass-card"
                />
              </div>
            </form>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed top-[120px] right-0 bottom-0 w-64 bg-card border-l border-border p-4">
              <nav className="space-y-4">
                <Link 
                  to="/" 
                  className="flex items-center gap-3 text-foreground hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Home className="w-5 h-5" />
                  Home
                </Link>
                <Link 
                  to={isAuthenticated ? "/my-bookings" : "/profile"} 
                  className="flex items-center gap-3 text-foreground hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Calendar className="w-5 h-5" />
                  My Bookings
                </Link>
                <Link 
                  to="/profile" 
                  className="flex items-center gap-3 text-foreground hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <UserCircle className="w-5 h-5" />
                  Profile
                </Link>
                {!isAuthenticated && (
                  <Button variant="hero" className="w-full" onClick={() => {
                    navigate('/profile');
                    setMobileMenuOpen(false);
                  }}>
                    Login
                  </Button>
                )}
              </nav>
            </div>
          </div>
        )}

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
          <div className="grid grid-cols-4 gap-1 p-2">
            <Link 
              to="/" 
              className="flex flex-col items-center gap-1 p-2 text-xs text-muted-foreground hover:text-primary"
            >
              <Home className="w-5 h-5" />
              Home
            </Link>
            <Link 
              to={isAuthenticated ? "/my-bookings" : "/profile"} 
              className="flex flex-col items-center gap-1 p-2 text-xs text-muted-foreground hover:text-primary"
            >
              <Calendar className="w-5 h-5" />
              Bookings
            </Link>
            <Link 
              to={isAuthenticated ? "/wishlist" : "/profile"} 
              className="flex flex-col items-center gap-1 p-2 text-xs text-muted-foreground hover:text-primary"
            >
              <Heart className="w-5 h-5" />
              Wishlist
            </Link>
            <Link 
              to="/profile" 
              className="flex flex-col items-center gap-1 p-2 text-xs text-muted-foreground hover:text-primary"
            >
              <User className="w-5 h-5" />
              Profile
            </Link>
          </div>
        </nav>
      </>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-2xl font-display font-bold text-primary">
            Vastraveda
          </Link>


          {/* Navigation Icons */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Wishlist"
              onClick={() => navigate(isAuthenticated ? '/wishlist' : '/profile')}
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] leading-4 text-center font-semibold">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Button>

            <NotificationBell />
            
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  Welcome, {user?.name}
                </span>
                <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
                  <User className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => navigate('/profile')}>
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};