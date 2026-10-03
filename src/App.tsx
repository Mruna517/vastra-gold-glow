import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import ProductDetail from "./pages/ProductDetail";
import AdminLogin from "./pages/AdminLogin";
import UpdatedAdminDashboard from "./pages/UpdatedAdminDashboard";
import MyBookings from "./pages/MyBookings";
import Profile from "./pages/Profile";
import Wishlist from "./pages/Wishlist";
import NotFound from "./pages/NotFound";
import { AdminRoute, UserRoute } from "@/components/RouteGuards";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen film-grain">
            <Routes>
              <Route path="/" element={<UserRoute><Index /></UserRoute>} />
              <Route path="/product/:id" element={<UserRoute><ProductDetail /></UserRoute>} />
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminRoute><UpdatedAdminDashboard /></AdminRoute>} />
              <Route path="/my-bookings" element={<UserRoute><MyBookings /></UserRoute>} />
              <Route path="/wishlist" element={<UserRoute><Wishlist /></UserRoute>} />
              <Route path="/profile" element={<UserRoute><Profile /></UserRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;