import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Trash2, Plane, Calendar, Users, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import api from '@/config/api';
import { useNavigate } from 'react-router-dom';
import { paymentService } from '@/services/paymentService';
import { useAuthenticatedAction } from '@/hooks/useAuthenticatedAction';

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

interface FlightBooking {
  _id: string;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  flightDetails: {
    from: string;
    to: string;
    departureDate: string;
    passengers: {
      adults: number;
      children: number;
      infants: number;
    };
    selectedFlight: {
      flightId: string;
      airline: string;
      departureTime: string;
      arrivalTime: string;
      price: {
        total: number;
        currency: string;
      };
      class: string;
    };
  };
  status: string;
  paymentDetails: {
    status: string;
    currency: string;
    transactions: Transaction[];
  };
  createdAt: string;
}

interface ApiResponse {
  success: boolean;
  count: number;
  data: FlightBooking[];
}

interface LocalCartItem {
  from: string;
  to: string;
  departureTime: string;
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
  flightId: string;
  airline: string;
  arrivalTime: string;
  price: number;
  currency: string;
  class: string;
}

const Cart = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const authenticatedAction = useAuthenticatedAction();
  const [bookings, setBookings] = useState<FlightBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      // Get items from localStorage first
      const localItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      
      // Convert local items to FlightBooking format
      const localBookings: FlightBooking[] = localItems.map((item: LocalCartItem, index: number) => ({
        _id: `local_${index}`,
        bookingId: `LOCAL-${index + 1000}`,
        customerName: 'Guest User',
        customerEmail: '',
        flightDetails: {
          from: item.from,
          to: item.to,
          departureDate: item.departureTime,
          passengers: item.passengers,
          selectedFlight: {
            flightId: item.flightId,
            airline: item.airline,
            departureTime: item.departureTime,
            arrivalTime: item.arrivalTime,
            price: {
              total: item.price,
              currency: item.currency
            },
            class: item.class
          }
        },
        status: 'pending',
        paymentDetails: {
          status: 'pending',
          currency: item.currency,
          transactions: []
        },
        createdAt: new Date().toISOString()
      }));

      // If user is logged in, also get items from backend and merge
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get<ApiResponse>('/cart');
          if (response.data.success && Array.isArray(response.data.data)) {
            // Merge local and server bookings
            setBookings([...localBookings, ...response.data.data]);
          } else {
            setBookings(localBookings);
            console.error('Invalid response format:', response.data);
          }
        } catch (error) {
          console.error('Error fetching server bookings:', error);
          setBookings(localBookings);
        }
      } else {
        setBookings(localBookings);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      toast({
        title: t('error', 'Error'),
        description: t('fetchBookingsError', 'Failed to load cart items. Please try again.'),
        variant: 'destructive',
      });
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCheckout = () => {
    // Check if user is logged in before proceeding to checkout
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: t('loginRequired', 'Login Required'),
        description: t('pleaseLoginToCheckout', 'Please log in to complete your purchase'),
        variant: 'destructive',
      });
      navigate('/login', { 
        state: { 
          returnUrl: '/cart',
          message: 'Please log in to complete your purchase'
        } 
      });
      return;
    }
    
    // Proceed to checkout
    navigate('/checkout');
  };

  const handleDelete = async (booking: FlightBooking) => {
    try {
      if (booking._id.startsWith('local_')) {
        // Handle local cart item deletion
        const localItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
        const index = parseInt(booking._id.split('_')[1]);
        localItems.splice(index, 1);
        localStorage.setItem('cartItems', JSON.stringify(localItems));
        setBookings(bookings.filter(b => b._id !== booking._id));
      } else {
        // Handle server-side cart item deletion
        await api.delete(`/cart/${booking._id}`);
        setBookings(bookings.filter(b => b._id !== booking._id));
      }
      toast({
        title: t('success', 'Success'),
        description: t('bookingDeleted', 'Booking has been deleted successfully'),
      });
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast({
        title: t('error', 'Error'),
        description: t('deleteBookingError', 'Failed to delete booking. Please try again.'),
        variant: 'destructive',
      });
    }
  };

  const handleProceedToPayment = async (booking: FlightBooking) => {
    authenticatedAction(async () => {
      try {
        setProcessingPayment(booking._id);
        const amount = booking.flightDetails?.selectedFlight?.price?.total || 0;
        const paymentUrl = await paymentService.initiatePayment(amount, booking.bookingId);
        window.location.href = paymentUrl;
      } catch (error) {
        console.error('Payment initiation error:', error);
        toast({
          title: t('error', 'Error'),
          description: t('paymentInitiationError', 'Failed to initiate payment. Please try again.'),
          variant: 'destructive',
        });
        setProcessingPayment(null);
      }
    });
  };

  if (loading) {
    return (
      <div className="container-custom py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-tourtastic-blue border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-bold mb-8 text-center md:text-left">{t('yourBookings', 'Your Bookings')}</h1>

      {!bookings || bookings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">{t('noBookings', 'No bookings found in your cart.')}</p>
          <Button
            onClick={() => navigate('/flights')}
            className="mt-4 bg-tourtastic-blue hover:bg-tourtastic-dark-blue text-white"
          >
            {t('searchFlights', 'Search Flights')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking) => {
            const airline = booking?.flightDetails?.selectedFlight?.airline || 'Unknown Airline';
            const flightId = booking?.flightDetails?.selectedFlight?.flightId || 'N/A';
            const from = booking?.flightDetails?.from || 'N/A';
            const to = booking?.flightDetails?.to || 'N/A';
            const departureDate = booking?.flightDetails?.departureDate;
            const passengers = booking?.flightDetails?.passengers || { adults: 0, children: 0, infants: 0 };
            const cabinClass = booking?.flightDetails?.selectedFlight?.class || 'N/A';
            const status = booking?.status || 'pending';
            const price = booking?.flightDetails?.selectedFlight?.price || { total: 0, currency: 'USD' };
            const paymentStatus = booking?.paymentDetails?.status || 'pending';

            return (
              <Card key={booking._id} className="p-4 md:p-6 bg-gradient-to-br from-white to-gray-50 border-2 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row justify-between gap-6">
                    {/* Flight Details */}
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-4 mb-6 bg-tourtastic-blue bg-opacity-10 p-6 rounded-lg">
                        <div className="relative h-24 w-24 flex-shrink-0">
                          <img
                            src={`/${airline.replace(/\s+/g, '-')}-Logo.png`}
                            alt={`${airline} logo`}
                            className="object-contain w-full h-full"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder.svg';
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-xl font-bold text-tourtastic-blue">{airline}</h2>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Flight {flightId}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-4 rounded-lg shadow-sm">
                        <div className="border-r border-gray-200 pr-4">
                          <div className="flex items-center gap-2 text-tourtastic-blue mb-2">
                            <Calendar className="h-4 w-4" />
                            <div className="text-sm font-medium">{t('route', 'Route')}</div>
                          </div>
                          <div className="font-semibold text-lg">
                            <span className="text-gray-700">{from}</span>
                            <span className="mx-2 text-tourtastic-blue">→</span>
                            <span className="text-gray-700">{to}</span>
                          </div>
                        </div>

                        <div className="border-r border-gray-200 pr-4">
                          <div className="flex items-center gap-2 text-tourtastic-blue mb-2">
                            <Calendar className="h-4 w-4" />
                            <div className="text-sm font-medium">{t('departure', 'Departure')}</div>
                          </div>
                          <div className="font-semibold text-lg text-gray-700">
                            {departureDate ? format(new Date(departureDate), 'MMM dd, yyyy hh:mm a') : 'N/A'}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 text-tourtastic-blue mb-2">
                            <Users className="h-4 w-4" />
                            <div className="text-sm font-medium">{t('passengers', 'Passengers')}</div>
                          </div>
                          <div className="font-semibold text-lg text-gray-700">
                            {passengers.adults} {t('adults', 'Adults')}
                            {passengers.children > 0 && `, ${passengers.children} ${t('children', 'Children')}`}
                            {passengers.infants > 0 && `, ${passengers.infants} ${t('infants', 'Infants')}`}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px] bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-tourtastic-blue mb-2">
                            <div className="text-sm font-medium">{t('class', 'Class')}</div>
                          </div>
                          <div className="font-semibold text-lg text-gray-700">
                            {(() => {
                              const classCode = cabinClass.toLowerCase();
                              switch(classCode) {
                                case 'y':
                                case 'e':
                                case 'economy':
                                  return t('economy', 'Economy Class');
                                case 'w':
                                case 'pe':
                                case 'premium_economy':
                                  return t('premiumEconomy', 'Premium Economy Class');
                                case 'c':
                                case 'b':
                                case 'business':
                                  return t('business', 'Business Class');
                                case 'f':
                                case 'first':
                                  return t('first', 'First Class');
                                default:
                                  // If it's a single letter or short code, try to map it to a full name
                                  if (classCode.length <= 2) {
                                    return t('economy', 'Economy Class'); // Default to Economy if unknown short code
                                  }
                                  return t(classCode, classCode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
                              }
                            })()}
                          </div>
                        </div>

                        <div className="flex-1 min-w-[200px] bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-tourtastic-blue mb-2">
                            <div className="text-sm font-medium">{t('bookingStatus', 'Booking Status')}</div>
                          </div>
                          <div className={`font-semibold text-lg capitalize ${
                            status === 'pending' ? 'text-yellow-600' : 
                            status === 'confirmed' ? 'text-green-600' : 
                            'text-gray-700'
                          }`}>{status}</div>
                        </div>
                      </div>
                    </div>

                    {/* Price and Actions */}
                    <div className="lg:w-72 flex flex-col justify-between items-center md:items-end">
                      <div className="w-full bg-tourtastic-blue bg-opacity-10 rounded-lg p-4 text-center md:text-right mb-4">
                        <div className="text-sm font-medium text-tourtastic-blue mb-1">{t('totalPrice', 'Total Price')}</div>
                        <div className="text-3xl font-bold text-tourtastic-blue">
                          {price.currency} {price.total}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 w-full">
                        <Button
                          onClick={() => handleProceedToPayment(booking)}
                          className="w-full bg-tourtastic-blue hover:bg-tourtastic-dark-blue text-white flex items-center justify-center gap-2 py-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                          disabled={paymentStatus === 'completed' || processingPayment === booking._id}
                        >
                          <CreditCard className="h-5 w-5" />
                          {processingPayment === booking._id ? (
                            <span className="animate-pulse text-lg">{t('processing', 'Processing...')}</span>
                          ) : paymentStatus === 'completed' ? (
                            <span className="text-lg">{t('paid', 'Paid')}</span>
                          ) : (
                            <span className="text-lg">{t('proceedToPayment', 'Proceed to Payment')}</span>
                          )}
                        </Button>

                        <Button
                          onClick={() => handleDelete(booking)}
                          variant="outline"
                          className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 py-4 rounded-lg border-2 border-red-200 hover:border-red-400 transition-all duration-300"
                          disabled={status !== 'pending' || processingPayment === booking._id}
                        >
                          <Trash2 className="h-5 w-5 mr-2" />
                          <span className="text-lg">{t('delete', 'Delete')}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Cart;
