import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Destination, getAllDestinations, updateDestinationPopular } from '@/services/destinationService';

// Destination form schema
const destinationSchema = z.object({
  name: z.string().min(2, { message: "Destination name is required" }),
  country: z.string().min(2, { message: "Country is required" }),
  rating: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 5, {
    message: "Rating must be a number between 0 and 5",
  }),
  image: z.string().url({ message: "Please enter a valid image URL" }),
  popular: z.boolean().default(false),
});

type DestinationFormValues = z.infer<typeof destinationSchema>;

const AdminDestinations = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editDestination, setEditDestination] = useState<Destination | null>(null);
  const form = useForm<DestinationFormValues>({
    resolver: zodResolver(destinationSchema),
    defaultValues: {
      name: '',
      country: '',
      rating: '',
      image: '',
      popular: false,
    },
  });

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      const data = await getAllDestinations();
      setDestinations(data);
    } catch (error) {
      console.error('Error fetching destinations:', error);
      toast.error('Failed to load destinations');
    }
  };

  // Handle form submission
  const onSubmit = async (data: DestinationFormValues) => {
    try {
      if (editDestination) {
        // Update existing destination
        await updateDestinationPopular(editDestination._id, data.popular);
        await fetchDestinations();
        toast.success('Destination updated successfully!');
      }
      // Reset form and close dialog
      form.reset();
      setIsAddDialogOpen(false);
      setEditDestination(null);
    } catch (error) {
      console.error('Error updating destination:', error);
      toast.error('Failed to update destination');
    }
  };

  // Handle dialog close
  const handleDialogClose = () => {
    form.reset();
    setIsAddDialogOpen(false);
    setEditDestination(null);
  };

  // Filter destinations based on search query
  const filteredDestinations = destinations.filter(destination => 
    destination.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    destination.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Destinations Management</h1>
          <div className="flex gap-4">
            <Input
              type="text"
              placeholder="Search destinations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </div>
        </div>

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
                  <TableHead>Popular</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDestinations.map((destination) => (
                  <TableRow key={destination._id}>
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
                      <Button
                        variant={destination.popular ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setEditDestination(destination);
                          form.reset({
                            name: destination.name,
                            country: destination.country,
                            rating: destination.rating.toString(),
                            image: destination.image,
                            popular: !destination.popular,
                          });
                          setIsAddDialogOpen(true);
                        }}
                      >
                        {destination.popular ? "Popular" : "Not Popular"}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditDestination(destination);
                          form.reset({
                            name: destination.name,
                            country: destination.country,
                            rating: destination.rating.toString(),
                            image: destination.image,
                            popular: destination.popular,
                          });
                          setIsAddDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editDestination ? 'Edit Destination' : 'Add New Destination'}
              </DialogTitle>
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
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="popular"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Popular Destination</FormLabel>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="ml-2"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editDestination ? 'Update' : 'Add'} Destination
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminDestinations;
