
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  EyeIcon, 
  Pencil, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Filter 
} from 'lucide-react';

// Mock bookings data
const mockBookings = [
  {
    id: 'BK-1001',
    customerName: 'John Smith',
    customerEmail: 'john.smith@example.com',
    type: 'Flight + Hotel',
    destination: 'Paris, France',
    date: '2023-05-15',
    status: 'confirmed',
    amount: 1249.99,
  },
  {
    id: 'BK-1002',
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah.j@example.com',
    type: 'Hotel',
    destination: 'Rome, Italy',
    date: '2023-06-22',
    status: 'pending',
    amount: 799.50,
  },
  {
    id: 'BK-1003',
    customerName: 'Michael Chen',
    customerEmail: 'mchen@example.com',
    type: 'Flight',
    destination: 'Tokyo, Japan',
    date: '2023-07-10',
    status: 'confirmed',
    amount: 1105.25,
  },
  {
    id: 'BK-1004',
    customerName: 'Emma Wilson',
    customerEmail: 'emma.w@example.com',
    type: 'Tour Package',
    destination: 'Barcelona, Spain',
    date: '2023-05-30',
    status: 'cancelled',
    amount: 649.99,
  },
  {
    id: 'BK-1005',
    customerName: 'David Rodriguez',
    customerEmail: 'drodriguez@example.com',
    type: 'Flight + Hotel',
    destination: 'Cancun, Mexico',
    date: '2023-08-05',
    status: 'confirmed',
    amount: 1879.00,
  },
  {
    id: 'BK-1006',
    customerName: 'Jennifer Lee',
    customerEmail: 'jlee@example.com',
    type: 'Cruise',
    destination: 'Caribbean Islands',
    date: '2023-09-12',
    status: 'pending',
    amount: 2499.99,
  },
  {
    id: 'BK-1007',
    customerName: 'Robert Kim',
    customerEmail: 'rkim@example.com',
    type: 'Flight',
    destination: 'London, UK',
    date: '2023-06-18',
    status: 'confirmed',
    amount: 789.50,
  },
  {
    id: 'BK-1008',
    customerName: 'Lisa Brown',
    customerEmail: 'lbrown@example.com',
    type: 'Hotel',
    destination: 'New York, USA',
    date: '2023-07-25',
    status: 'cancelled',
    amount: 599.99,
  },
];

const AdminBookings: React.FC = () => {
  const [bookings] = useState(mockBookings);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Apply filters to bookings
  const filteredBookings = bookings.filter((booking) => {
    // Search filter
    const searchMatch = 
      booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const statusMatch = statusFilter === 'all' || booking.status === statusFilter;
    
    // Type filter
    const typeMatch = typeFilter === 'all' || booking.type === typeFilter;
    
    return searchMatch && statusMatch && typeMatch;
  });
  
  // Get status badge component
  const getStatusBadge = (status: string) => {
    let badgeClass = '';
    
    switch (status) {
      case 'confirmed':
        badgeClass = 'bg-green-100 text-green-800';
        break;
      case 'pending':
        badgeClass = 'bg-yellow-100 text-yellow-800';
        break;
      case 'cancelled':
        badgeClass = 'bg-red-100 text-red-800';
        break;
      default:
        badgeClass = 'bg-gray-100 text-gray-800';
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  
  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bookings Management</h1>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[240px]">
              <Input
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-500 mr-2">Filters:</span>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Flight">Flight</SelectItem>
                  <SelectItem value="Hotel">Hotel</SelectItem>
                  <SelectItem value="Flight + Hotel">Flight + Hotel</SelectItem>
                  <SelectItem value="Tour Package">Tour Package</SelectItem>
                  <SelectItem value="Cruise">Cruise</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Bookings Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{booking.customerName}</div>
                        <div className="text-xs text-gray-500">{booking.customerEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>{booking.type}</TableCell>
                    <TableCell>{booking.destination}</TableCell>
                    <TableCell>{new Date(booking.date).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>${booking.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon">
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-gray-500">No bookings found</div>
                    <div className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredBookings.length}</span> of{' '}
              <span className="font-medium">{filteredBookings.length}</span> bookings
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBookings;
