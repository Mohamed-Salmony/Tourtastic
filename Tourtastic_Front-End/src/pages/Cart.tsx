
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Mock cart data
const mockCartItems = [
  {
    id: 'item1',
    type: 'flight',
    name: 'Round Trip Flight: New York to Paris',
    image: 'https://cdn-icons-png.flaticon.com/512/3125/3125713.png',
    details: 'SkyHigh Airways - May 15, 2023',
    price: 549,
    quantity: 2,
  },
  {
    id: 'item2',
    type: 'hotel',
    name: 'Grand Hotel Paris',
    image: 'https://cdn-icons-png.flaticon.com/512/2933/2933772.png',
    details: '4 nights, Deluxe Room - May 15-19, 2023',
    price: 899,
    quantity: 1,
  },
  {
    id: 'item3',
    type: 'tour',
    name: 'Paris City Tour',
    image: 'https://cdn-icons-png.flaticon.com/512/3774/3774073.png',
    details: 'Full Day Tour - May 16, 2023',
    price: 89,
    quantity: 2,
  },
];

// Payment form schema
const paymentSchema = z.object({
  cardholderName: z.string().min(3, { message: "Cardholder name is required" }),
  cardNumber: z.string().regex(/^\d{16}$/, { message: "Card number must be 16 digits" }),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, { message: "Expiry date must be in MM/YY format" }),
  cvc: z.string().regex(/^\d{3,4}$/, { message: "CVC must be 3 or 4 digits" }),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

const Cart = () => {
  const [cartItems, setCartItems] = useState(mockCartItems);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  const handleRemoveItem = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };
  
  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCartItems(cartItems.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };
  
  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax rate
  const total = subtotal + tax;
  
  // Check if cart is empty
  const isCartEmpty = cartItems.length === 0;

  // Payment form
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      cardholderName: '',
      cardNumber: '',
      expiryDate: '',
      cvc: '',
    },
  });

  const onSubmit = (data: PaymentFormValues) => {
    console.log('Payment data:', data);
    toast.success('Payment processed successfully!');
    setIsCheckoutOpen(false);
    // In a real app, you would process the payment here
  };
  
  return (
    <Layout>
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 py-12">
        <div className="container-custom">
          <h1 className="text-4xl font-bold mb-4">Your Cart</h1>
          <p className="text-gray-600">
            Review your selected items before proceeding to checkout.
          </p>
        </div>
      </div>
      
      <div className="py-12 container-custom">
        {isCartEmpty ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
              <p className="text-gray-600 mb-8">
                You haven't added any flights, hotels, or experiences to your cart yet.
                Start exploring our destinations to find your next adventure!
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild>
                  <Link to="/flights">Find Flights</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/destinations">Explore Destinations</Link>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-6">Cart Items ({cartItems.length})</h2>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Item</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-center">Quantity</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cartItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <img 
                                src={item.image} 
                                alt={item.name}
                                className="h-10 w-10" 
                              />
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-gray-500">{item.details}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">${item.price}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                              <button
                                className="w-8 h-8 rounded-l border border-gray-300 bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              >
                                -
                              </button>
                              <span className="w-10 text-center border-y border-gray-300 h-8 flex items-center justify-center bg-white">
                                {item.quantity}
                              </span>
                              <button
                                className="w-8 h-8 rounded-r border border-gray-300 bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              >
                                +
                              </button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${(item.price * item.quantity).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-gray-500 hover:text-red-500"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
            
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxes & Fees</span>
                      <span className="font-medium">${tax.toFixed(2)}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-tourtastic-blue">${total.toFixed(2)}</span>
                    </div>
                    
                    <Popover open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                      <PopoverTrigger asChild>
                        <Button className="w-full mt-6" size="lg">
                          Proceed to Checkout
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="end" sideOffset={5}>
                        <div className="p-6 space-y-4">
                          <h3 className="text-lg font-bold mb-2">Payment Details</h3>
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                              <FormField
                                control={form.control}
                                name="cardholderName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Cardholder Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="John Smith" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="cardNumber"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Card Number</FormLabel>
                                    <FormControl>
                                      <Input placeholder="1234 5678 9012 3456" 
                                        {...field} 
                                        onChange={(e) => {
                                          // Only allow digits
                                          const value = e.target.value.replace(/\D/g, '');
                                          if (value.length <= 16) {
                                            field.onChange(value);
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="expiryDate"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Expiration Date</FormLabel>
                                      <FormControl>
                                        <Input 
                                          placeholder="MM/YY" 
                                          {...field} 
                                          onChange={(e) => {
                                            let { value } = e.target;
                                            value = value.replace(/\D/g, '');
                                            
                                            if (value.length > 0) {
                                              // Format as MM/YY
                                              if (value.length <= 2) {
                                                field.onChange(value);
                                              } else {
                                                field.onChange(`${value.slice(0, 2)}/${value.slice(2, 4)}`);
                                              }
                                            } else {
                                              field.onChange(value);
                                            }
                                          }}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="cvc"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>CVC</FormLabel>
                                      <FormControl>
                                        <Input 
                                          placeholder="123" 
                                          {...field} 
                                          onChange={(e) => {
                                            // Only allow digits
                                            const value = e.target.value.replace(/\D/g, '');
                                            if (value.length <= 4) {
                                              field.onChange(value);
                                            }
                                          }}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              
                              <div className="flex justify-between pt-2">
                                <Button 
                                  type="button" 
                                  variant="outline"
                                  onClick={() => setIsCheckoutOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button type="submit">Pay Now</Button>
                              </div>
                            </form>
                          </Form>
                        </div>
                      </PopoverContent>
                    </Popover>
                    
                    <p className="text-xs text-gray-500 text-center pt-4">
                      By proceeding, you agree to our Terms of Service and Privacy Policy.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Promo Code */}
              <Card className="mt-4">
                <CardContent className="p-6">
                  <h3 className="font-medium mb-2">Have a promo code?</h3>
                  <div className="flex gap-2">
                    <Input placeholder="Enter code" />
                    <Button variant="outline">Apply</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Cart;
