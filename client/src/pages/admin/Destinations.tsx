
import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Plus, MapPin, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Mock destinations data
const mockDestinations = [
  {
    id: 1,
    name: 'Paris',
    country: 'France',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGFyaXN8ZW58MHx8MHx8fDA%3D',
    featured: true,
  },
  {
    id: 2,
    name: 'Bali',
    country: 'Indonesia',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YmFsaXxlbnwwfHwwfHx8MA%3D%3D',
    featured: true,
  },
  {
    id: 3,
    name: 'New York',
    country: 'USA',
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8bmV3JTIweW9ya3xlbnwwfHwwfHx8MA%3D%3D',
    featured: false,
  },
  {
    id: 4,
    name: 'Tokyo',
    country: 'Japan',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dG9reW98ZW58MHx8MHx8fDA%3D',
    featured: false,
  },
  {
    id: 5,
    name: 'Sydney',
    country: 'Australia',
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3lkbmV5fGVufDB8fDB8fHww',
    featured: true,
  },
];

// Destination form schema
const destinationSchema = z.object({
  name: z.string().min(2, { message: "Destination name is required" }),
  country: z.string().min(2, { message: "Country is required" }),
  rating: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 5, {
    message: "Rating must be a number between 0 and 5",
  }),
  image: z.string().url({ message: "Please enter a valid image URL" }),
  featured: z.boolean().default(false),
});

type DestinationFormValues = z.infer<typeof destinationSchema>;

const AdminDestinations = () => {
  const [destinations, setDestinations] = useState(mockDestinations);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editDestination, setEditDestination] = useState<null | typeof mockDestinations[0]>(null);
  
  const form = useForm<DestinationFormValues>({
    resolver: zodResolver(destinationSchema),
    defaultValues: {
      name: '',
      country: '',
      rating: '4.5',
      image: '',
      featured: false,
    },
  });
  
  // Handle edit dialog open
  const handleEditDestination = (destination: typeof mockDestinations[0]) => {
    setEditDestination(destination);
    form.reset({
      name: destination.name,
      country: destination.country,
      rating: destination.rating.toString(),
      image: destination.image,
      featured: destination.featured,
    });
    setIsAddDialogOpen(true);
  };
  
  // Handle form submission
  const onSubmit = (data: DestinationFormValues) => {
    if (editDestination) {
      // Update existing destination
      setDestinations(destinations.map(d => 
        d.id === editDestination.id 
          ? { 
              ...d, 
              name: data.name, 
              country: data.country, 
              rating: parseFloat(data.rating), 
              image: data.image,
              featured: data.featured,
            } 
          : d
      ));
      toast.success('Destination updated successfully!');
    } else {
      // Add new destination
      const newDestination = {
        id: Math.max(...destinations.map(d => d.id)) + 1,
        name: data.name,
        country: data.country,
        rating: parseFloat(data.rating),
        image: data.image,
        featured: data.featured,
      };
      setDestinations([...destinations, newDestination]);
      toast.success('Destination added successfully!');
    }
    
    // Reset form and close dialog
    form.reset();
    setIsAddDialogOpen(false);
    setEditDestination(null);
  };
  
  // Handle dialog close
  const handleDialogClose = () => {
    form.reset();
    setIsAddDialogOpen(false);
    setEditDestination(null);
  };
  
  // Delete destination
  const handleDeleteDestination = (id: number) => {
    setDestinations(destinations.filter(d => d.id !== id));
    toast.success('Destination deleted successfully!');
  };
  
  // Filter destinations based on search query
  const filteredDestinations = destinations.filter(destination => 
    destination.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    destination.country.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Destinations Management</h1>
          <Button onClick={() => {
            form.reset({
              name: '',
              country: '',
              rating: '4.5',
              image: '',
              featured: false,
            });
            setEditDestination(null);
            setIsAddDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Destination
          </Button>
        </div>
        
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0 md:space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search destinations..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-xl">Destinations List</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDestinations.map((destination) => (
                  <TableRow key={destination.id}>
                    <TableCell>
                      <img
                        src={destination.image}
                        alt={destination.name}
                        className="h-12 w-20 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{destination.name}</TableCell>
                    <TableCell>{destination.country}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-1">★</span>
                        {destination.rating.toFixed(1)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {destination.featured ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Featured
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Regular
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditDestination(destination)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteDestination(destination.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredDestinations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      <div className="flex flex-col items-center">
                        <MapPin className="h-10 w-10 text-gray-400 mb-2" />
                        <p className="text-gray-500">No destinations found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Add/Edit Destination Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editDestination ? 'Edit Destination' : 'Add New Destination'}</DialogTitle>
            <DialogDescription>
              {editDestination 
                ? 'Update the destination details below.' 
                : 'Fill in the details to add a new destination to your catalog.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Paris" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., France" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating (0-5)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="5" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Featured Destination</FormLabel>
                      <p className="text-sm text-gray-500">
                        Featured destinations will be highlighted on the homepage.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editDestination ? 'Update Destination' : 'Add Destination'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminDestinations;
