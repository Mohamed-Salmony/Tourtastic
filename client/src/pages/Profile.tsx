import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { Star, Plane, Calendar, CreditCard, User, Mail, Phone } from 'lucide-react';
import { api } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Mock user data
const mockUser = {
  id: 'user123',
  name: 'John Smith',
  email: 'john.smith@example.com',
  phone: '+1 (555) 123-4567',
  avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  address: '123 Main St, New York, NY 10001',
  birthdate: '1985-04-15',
};

// Mock bookings data
const mockBookings = [
  {
    id: 'book1',
    type: 'Flight + Hotel',
    destination: 'Paris, France',
    status: 'upcoming',
    dates: 'May 15-22, 2023',
    price: 1449,
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200',
  },
  {
    id: 'book2',
    type: 'Flight',
    destination: 'Tokyo, Japan',
    status: 'completed',
    dates: 'Feb 10-18, 2023',
    price: 1299,
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200',
  },
  {
    id: 'book3',
    type: 'Hotel',
    destination: 'Rome, Italy',
    status: 'cancelled',
    dates: 'Jan 5-10, 2023',
    price: 799,
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200',
  },
];

// Mock wishlist data
const mockWishlist = [
  {
    id: 'wish1',
    name: 'Santorini',
    country: 'Greece',
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200',
    rating: 4.9,
    price: 1499,
  },
  {
    id: 'wish2',
    name: 'Bali',
    country: 'Indonesia',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200',
    rating: 4.7,
    price: 1099,
  },
  {
    id: 'wish3',
    name: 'Sydney',
    country: 'Australia',
    image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200',
    rating: 4.8,
    price: 1899,
  },
];

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(mockUser);
  const [bookings, setBookings] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState(user);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!authUser) {
          throw new Error('User not authenticated');
        }

        // Fetch user profile
        const userResponse = await api.get(`/users/${authUser._id}`);
        setUser(userResponse.data.data);
        setEditFormData(userResponse.data.data);

        // Fetch user's flight bookings
        const bookingsResponse = await api.get('/flights/bookings');
        console.log('Bookings response:', bookingsResponse.data);
        setBookings(bookingsResponse.data.data);

        // Fetch user's wishlist
        const wishlistResponse = await api.get(`/users/${authUser._id}/wishlist`);
        console.log('Wishlist response:', wishlistResponse.data);
        setWishlist(wishlistResponse.data.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };

    if (authUser) {
      fetchUserData();
    }
  }, [authUser]);

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSaveProfile = async () => {
    try {
      if (!authUser) {
        throw new Error('User not authenticated');
      }

      const response = await api.put(`/users/${authUser._id}`, editFormData);
      setUser(response.data.data);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };
  
  const handleRemoveWishlistItem = async (id: string) => {
    try {
      if (!authUser) {
        throw new Error('User not authenticated');
      }

      await api.delete(`/users/${authUser._id}/wishlist/${id}`);
      setWishlist(wishlist.filter(item => item._id !== id));
      toast.success('Item removed from wishlist');
    } catch (error) {
      console.error('Error removing wishlist item:', error);
      toast.error('Failed to remove item from wishlist');
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Upcoming</span>;
      case 'completed':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Completed</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Cancelled</span>;
      default:
        return null;
    }
  };
  
  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setIsDetailsOpen(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    try {
      setIsChangingPassword(true);
      const response = await api.put('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data.success) {
        toast.success('Password changed successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleViewDestination = (destinationId: string) => {
    navigate(`/destinations/${destinationId}`);
  };

  return (
    <>
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 py-8 md:py-12">
        <div className="container-custom px-4 md:px-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 md:mb-4">My Profile</h1>
          <p className="text-sm md:text-base text-gray-600">
            Manage your account details, view your bookings, and access your saved destinations.
          </p>
        </div>
      </div>
      
      <div className="py-8 md:py-12 container-custom px-4 md:px-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tourtastic-blue"></div>
          </div>
        ) : (
          <>
            {/* Profile Card */}
            <Card className="mb-8">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col items-center text-center">
                  {/* Profile Info */}
                  <div className="space-y-4 w-full max-w-md">
                    <div>
                      <h2 className="text-2xl font-bold">{user.name}</h2>
                      <p className="text-gray-600">{user.email}</p>
                    </div>

                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            value={editFormData.name}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, name: e.target.value })
                            }
                          />
                        </div>
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsEditing(false);
                              setEditFormData(user);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleSaveProfile}>Save Changes</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(!isEditing)}
                        >
                          Edit Profile
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="bookings" className="space-y-6">
              <TabsList className="w-full md:w-auto">
                <TabsTrigger value="bookings" className="flex-1 md:flex-none">My Bookings</TabsTrigger>
                <TabsTrigger value="wishlist" className="flex-1 md:flex-none">My Wishlist</TabsTrigger>
                <TabsTrigger value="settings" className="flex-1 md:flex-none">Account Settings</TabsTrigger>
              </TabsList>
              
              {/* Bookings Tab */}
              <TabsContent value="bookings">
                <Card>
                  <CardContent className="p-4 md:p-6">
                    <h3 className="text-xl font-bold mb-6">My Bookings</h3>
                    
                    {bookings.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Booking</TableHead>
                              <TableHead>Flight Details</TableHead>
                              <TableHead className="hidden md:table-cell">Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bookings.map((booking) => (
                              <TableRow key={booking._id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Plane className="h-5 w-5 text-tourtastic-blue" />
                                    <span className="font-medium">{booking.bookingId}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-4">
                                    <div>
                                      <p className="font-medium">{booking.flightDetails.from} → {booking.flightDetails.to}</p>
                                      <p className="text-sm text-gray-500">{booking.flightDetails.selectedFlight.airline}</p>
                                      <p className="text-sm text-gray-500 md:hidden">{formatDate(booking.flightDetails.departureDate)}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  {formatDate(booking.flightDetails.departureDate)}
                                </TableCell>
                                <TableCell>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                    ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'}`}>
                                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  ${booking.flightDetails.selectedFlight.price.total}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewDetails(booking)}
                                  >
                                    View Details
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">You don't have any bookings yet.</p>
                        <Button className="mt-4">Find Your Next Trip</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Wishlist Tab */}
              <TabsContent value="wishlist">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-6">My Wishlist</h3>
                    
                    {wishlist.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {wishlist.map((item) => {
                          console.log('Wishlist item:', item);
                          return (
                            <Card key={item._id} className="overflow-hidden">
                              <div className="relative h-36">
                                <img 
                                  src={item.image || 'https://via.placeholder.com/400x200?text=No+Image'} 
                                  alt={item.name}
                                  className="w-full h-full object-cover" 
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://via.placeholder.com/400x200?text=No+Image';
                                  }}
                                />
                                <button 
                                  onClick={() => handleRemoveWishlistItem(item._id)}
                                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                  </svg>
                                </button>
                              </div>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h4 className="font-bold">{item.name}</h4>
                                    <p className="text-xs text-gray-500">{item.country}</p>
                                  </div>
                                  <div className="flex items-center">
                                    <Star className="h-3 w-3 text-tourtastic-blue mr-1 fill-current" />
                                    <span className="text-xs font-medium">{item.rating}</span>
                                  </div>
                                </div>
                                {item.description && (
                                  <p className="text-sm text-gray-600 mb-2">
                                    {item.description.length > 100 
                                      ? `${item.description.substring(0, 100)}...` 
                                      : item.description}
                                  </p>
                                )}
                                <Button 
                                  size="sm" 
                                  className="w-full mt-2"
                                  onClick={() => handleViewDestination(item._id)}
                                >
                                  View Details
                                </Button>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">You haven't saved any destinations yet.</p>
                        <Button 
                          className="mt-4"
                          onClick={() => navigate('/destinations')}
                        >
                          Explore Destinations
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Settings Tab */}
              <TabsContent value="settings">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-6">Account Settings</h3>
                    
                    {/* Change Password Form */}
                    <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, currentPassword: e.target.value })
                          }
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, newPassword: e.target.value })
                          }
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                          }
                          required
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Booking Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <DialogContent className="max-w-2xl w-[95vw] md:w-full max-h-[90vh] overflow-y-auto p-0">
                <div className="sticky top-0 bg-white z-10 border-b shadow-sm">
                  <div className="p-6 pb-4">
                    <DialogTitle>Booking Details</DialogTitle>
                    <DialogDescription>
                      Booking ID: {selectedBooking?.bookingId}
                    </DialogDescription>
                  </div>
                </div>
                
                {selectedBooking && (
                  <div className="space-y-4 p-6">
                    {/* Flight Details */}
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold flex items-center gap-2">
                        <Plane className="h-4 w-4 text-tourtastic-blue" />
                        Flight Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500">Route</p>
                          <p className="text-sm font-medium">{selectedBooking.flightDetails.from} → {selectedBooking.flightDetails.to}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Airline</p>
                          <p className="text-sm font-medium">{selectedBooking.flightDetails.selectedFlight.airline}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Departure</p>
                          <p className="text-sm font-medium">{formatDate(selectedBooking.flightDetails.departureDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Flight Class</p>
                          <p className="text-sm font-medium">{selectedBooking.flightDetails.selectedFlight.class}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Passenger Details */}
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold flex items-center gap-2">
                        <User className="h-4 w-4 text-tourtastic-blue" />
                        Passenger Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500">Name</p>
                          <p className="text-sm font-medium">{selectedBooking.customerName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm font-medium">{selectedBooking.customerEmail}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Passengers</p>
                          <p className="text-sm font-medium">
                            {selectedBooking.flightDetails.passengers.adults} Adult(s)
                            {selectedBooking.flightDetails.passengers.children > 0 && `, ${selectedBooking.flightDetails.passengers.children} Child(ren)`}
                            {selectedBooking.flightDetails.passengers.infants > 0 && `, ${selectedBooking.flightDetails.passengers.infants} Infant(s)`}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Payment Details */}
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-tourtastic-blue" />
                        Payment Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500">Amount</p>
                          <p className="text-sm font-medium">${selectedBooking.flightDetails.selectedFlight.price.total}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Status</p>
                          <p className="text-sm font-medium">{selectedBooking.paymentDetails.status}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Timeline */}
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-tourtastic-blue" />
                        Booking Timeline
                      </h3>
                      <div className="space-y-2">
                        {selectedBooking.timeline.map((event, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-tourtastic-blue mt-1.5"></div>
                            <div>
                              <p className="text-sm font-medium">{event.status}</p>
                              <p className="text-xs text-gray-500">{formatDate(event.date)}</p>
                              {event.notes && (
                                <p className="text-xs text-gray-500">{event.notes}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </>
  );
};

export default Profile;
