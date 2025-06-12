import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cartService, CartItem } from '@/services/cartService';

// Remove payment schema since we're not using it anymore

const Cart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadCartItems();
  }, []);

  const loadCartItems = async () => {
    try {
      const items = await cartService.getCartItems();
      setCartItems(items);
    } catch (error) {
      toast.error('Failed to load cart items');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRemoveItem = async (id: string) => {
    if (!id) {
      toast.error('Invalid item ID');
      return;
    }
    try {
      await cartService.removeFromCart(id);
      setCartItems(cartItems.filter(item => item.bookingId !== id));
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Remove item error:', error);
      toast.error('Failed to remove item');
    }
  };

  const handleUpdateQuantity = async (id: string, newQuantity: number) => {
    if (!id) {
      toast.error('Invalid item ID');
      return;
    }
    if (newQuantity < 1) return;
    try {
      await cartService.updateQuantity(id, newQuantity);
      setCartItems(cartItems.map(item => 
        item.bookingId === id ? { ...item, quantity: newQuantity } : item
      ));
      toast.success('Quantity updated successfully');
    } catch (error) {
      console.error('Update quantity error:', error);
      toast.error('Failed to update quantity');
    }
  };
  
  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax rate
  const total = subtotal + tax;
  
  // Check if cart is empty
  const isCartEmpty = cartItems.length === 0;
  
  return (
    <>
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 py-12">
        <div className="container-custom">
          <h1 className="text-4xl font-bold mb-4">Your Cart</h1>
          <p className="text-gray-600">
            Review your selected items before proceeding to checkout.
          </p>
        </div>
      </div>
      
      <div className="py-12 container-custom">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-tourtastic-blue" />
          </div>
        ) : isCartEmpty ? (
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
                      {cartItems.map((item, index) => (
                        <TableRow key={`${item.bookingId || index}`}>
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
                                onClick={() => handleUpdateQuantity(item.bookingId, item.quantity - 1)}
                              >
                                -
                              </button>
                              <span className="w-10 text-center border-y border-gray-300 h-8 flex items-center justify-center bg-white">
                                {item.quantity}
                              </span>
                              <button
                                className="w-8 h-8 rounded-r border border-gray-300 bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                                onClick={() => handleUpdateQuantity(item.bookingId, item.quantity + 1)}
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
                              onClick={() => handleRemoveItem(item.bookingId)}
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
                    
                    <Button 
                      className="w-full mt-6" 
                      size="lg"
                      onClick={async () => {
                        try {
                          await cartService.checkout();
                          toast.success('Booking confirmed successfully!');
                          setCartItems([]); // Clear cart after successful booking
                        } catch (error) {
                          toast.error('Failed to confirm booking');
                        }
                      }}
                    >
                      Confirm Booking
                    </Button>
                    
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
    </>
  );
};

export default Cart;
