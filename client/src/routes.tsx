import { Routes, Route, Outlet } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Flights from './pages/Flights';
import Destinations from './pages/Destinations';
import DestinationDetails from './pages/DestinationDetails';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import ForgotPassword from './pages/ForgotPassword';
import { RequireAuth } from './providers/RequireAuth';
import PaymentSuccess from './pages/PaymentSuccess';

// Protected pages
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminBookings from './pages/admin/Bookings';
import AdminProfile from './pages/admin/Profile';
import AdminUsers from './pages/admin/Users';
import AdminDestinations from './pages/admin/Destinations';
import AdminReports from './pages/admin/Reports';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<Layout><Outlet /></Layout>}>
        <Route index element={<Home />} />
        <Route path="/flights" element={<Flights />} />
        <Route path="/destinations" element={<Destinations />} />
        <Route path="/destinations/:destinationId" element={<DestinationDetails />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/cart" element={<Cart />} />

        {/* Protected User Routes */}
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<RequireAuth><AdminLayout><AdminDashboard /></AdminLayout></RequireAuth>} />
        <Route path="/admin/bookings" element={<RequireAuth><AdminLayout><AdminBookings /></AdminLayout></RequireAuth>} />
        <Route path="/admin/users" element={<RequireAuth><AdminLayout><AdminUsers /></AdminLayout></RequireAuth>} />
        <Route path="/admin/destinations" element={<RequireAuth><AdminLayout><AdminDestinations /></AdminLayout></RequireAuth>} />
        <Route path="/admin/reports" element={<RequireAuth><AdminLayout><AdminReports /></AdminLayout></RequireAuth>} />
        <Route path="/admin/profile" element={<RequireAuth><AdminLayout><AdminProfile /></AdminLayout></RequireAuth>} />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;