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

const Cart = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const authenticatedAction = useAuthenticatedAction();
  const [bookings, setBookings] = useState<FlightBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse>('/cart');
      if (response.data.success && Array.isArray(response.data.data)) {
        setBookings(response.data.data);
      } else {
        setBookings([]);
        console.error('Invalid response format:', response.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
      toast({
        title: t('error', 'Error'),
        description: t('fetchBookingsError', 'Failed to fetch bookings. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleDelete = async (booking: FlightBooking) => {
    try {
      await api.delete(`/cart/${booking._id}`);
      setBookings(bookings.filter(b => b._id !== booking._id));
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
              <Card key={booking._id} className="p-4 md:p-6">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row justify-between gap-6">
                    {/* Flight Details */}
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                        <Plane className="h-5 w-5 text-tourtastic-blue" />
                        <h2 className="text-xl font-semibold">{airline}</h2>
                        <span className="text-sm text-gray-500">({flightId})</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">{t('route', 'Route')}</div>
                          <div className="font-medium">
                            {from} → {to}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-500 mb-1">{t('departure', 'Departure')}</div>
                          <div className="font-medium">
                            {departureDate ? format(new Date(departureDate), 'MMM dd, yyyy HH:mm') : 'N/A'}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-500 mb-1">{t('passengers', 'Passengers')}</div>
                          <div className="font-medium">
                            {passengers.adults} {t('adults', 'Adults')}
                            {passengers.children > 0 && `, ${passengers.children} ${t('children', 'Children')}`}
                            {passengers.infants > 0 && `, ${passengers.infants} ${t('infants', 'Infants')}`}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">{t('class', 'Class')}</div>
                          <div className="font-medium capitalize">{cabinClass}</div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-500 mb-1">{t('bookingStatus', 'Booking Status')}</div>
                          <div className="font-medium capitalize">{status}</div>
                        </div>
                      </div>
                    </div>

                    {/* Price and Actions */}
                    <div className="lg:w-64 flex flex-col justify-between items-center md:items-end">
                      <div className="mb-4 text-center md:text-right">
                        <div className="text-sm text-gray-500 mb-1">{t('totalPrice', 'Total Price')}</div>
                        <div className="text-2xl font-bold">
                          {price.currency} {price.total}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 w-full md:w-auto">
                        <Button
                          onClick={() => handleProceedToPayment(booking)}
                          className="w-full bg-tourtastic-blue hover:bg-tourtastic-dark-blue text-white flex items-center justify-center gap-2"
                          disabled={paymentStatus === 'completed' || processingPayment === booking._id}
                        >
                          <CreditCard className="h-4 w-4" />
                          {processingPayment === booking._id ? (
                            <span className="animate-pulse">{t('processing', 'Processing...')}</span>
                          ) : paymentStatus === 'completed' ? (
                            t('paid', 'Paid')
                          ) : (
                            t('proceedToPayment', 'Proceed to Payment')
                          )}
                        </Button>

                        <Button
                          onClick={() => handleDelete(booking)}
                          variant="outline"
                          className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                          disabled={status !== 'pending' || processingPayment === booking._id}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('delete', 'Delete')}
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
