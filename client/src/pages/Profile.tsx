import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
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
import { toast } from 'sonner';
import { Star } from 'lucide-react';

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
  const [user, setUser] = useState(mockUser);
  const [bookings] = useState(mockBookings);
  const [wishlist, setWishlist] = useState(mockWishlist);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState(user);
  
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSaveProfile = () => {
    setUser(editFormData);
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };
  
  const handleRemoveWishlistItem = (id: string) => {
    setWishlist(wishlist.filter(item => item.id !== id));
    toast.success('Item removed from wishlist');
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
  
  return (
    <Layout>
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 py-12">
        <div className="container-custom">
          <h1 className="text-4xl font-bold mb-4">My Profile</h1>
          <p className="text-gray-600">
            Manage your account details, view your bookings, and access your saved destinations.
          </p>
        </div>
      </div>
      
      <div className="py-12 container-custom">
        {/* Profile Card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-grow space-y-2 text-center md:text-left">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-gray-600">{user.phone}</p>
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                )}
              </div>
            </div>
            
            {isEditing && (
              <div className="mt-8 border-t pt-6">
                <h3 className="font-bold text-lg mb-4">Edit Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      name="name"
                      value={editFormData.name} 
                      onChange={handleEditFormChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      name="email"
                      type="email" 
                      value={editFormData.email} 
                      onChange={handleEditFormChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      name="phone"
                      value={editFormData.phone} 
                      onChange={handleEditFormChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input 
                      id="address" 
                      name="address"
                      value={editFormData.address} 
                      onChange={handleEditFormChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="birthdate">Date of Birth</Label>
                    <Input 
                      id="birthdate" 
                      name="birthdate"
                      type="date" 
                      value={editFormData.birthdate} 
                      onChange={handleEditFormChange}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-4 mt-6">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button onClick={handleSaveProfile}>Save Changes</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Tabs for Bookings, Wishlist, and Settings */}
        <Tabs defaultValue="bookings">
          <TabsList className="mb-6">
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
            <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
            <TabsTrigger value="settings">Account Settings</TabsTrigger>
          </TabsList>
          
          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-6">My Bookings</h3>
                
                {bookings.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <img 
                                src={booking.image} 
                                alt={booking.destination}
                                className="h-12 w-16 object-cover rounded" 
                              />
                              <div>
                                <p className="font-medium">{booking.destination}</p>
                                <p className="text-sm text-gray-500">{booking.type}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{booking.dates}</TableCell>
                          <TableCell>{getStatusBadge(booking.status)}</TableCell>
                          <TableCell className="text-right">${booking.price}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                    {wishlist.map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        <div className="relative h-36">
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover" 
                          />
                          <button 
                            onClick={() => handleRemoveWishlistItem(item.id)}
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
                          <p className="text-sm font-bold text-tourtastic-blue">From ${item.price}</p>
                          <Button size="sm" className="w-full mt-2">View Details</Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">You haven't saved any destinations yet.</p>
                    <Button className="mt-4">Explore Destinations</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardContent className="p-6 space-y-6">
                <h3 className="text-xl font-bold mb-2">Account Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Change Password</h4>
                    <div className="grid gap-4 max-w-md">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input id="current-password" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input id="confirm-password" type="password" />
                      </div>
                      <Button className="mt-2">Change Password</Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-2">Notification Preferences</h4>
                    <div className="space-y-2 max-w-md">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email-notifications">Email notifications</Label>
                        <input 
                          id="email-notifications" 
                          type="checkbox" 
                          defaultChecked 
                          className="h-4 w-4 rounded border-gray-300 text-tourtastic-blue focus:ring-tourtastic-blue" 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="marketing-emails">Marketing emails</Label>
                        <input 
                          id="marketing-emails" 
                          type="checkbox" 
                          className="h-4 w-4 rounded border-gray-300 text-tourtastic-blue focus:ring-tourtastic-blue" 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="special-offers">Special offers</Label>
                        <input 
                          id="special-offers" 
                          type="checkbox" 
                          defaultChecked 
                          className="h-4 w-4 rounded border-gray-300 text-tourtastic-blue focus:ring-tourtastic-blue" 
                        />
                      </div>
                      <Button variant="outline" className="mt-2">Save Preferences</Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-2">Delete Account</h4>
                    <p className="text-sm text-gray-500 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                    <Button variant="destructive">Delete My Account</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Profile;
