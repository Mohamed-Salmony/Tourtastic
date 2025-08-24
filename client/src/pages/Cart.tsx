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
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const authenticatedAction = useAuthenticatedAction();
  // Simple airport type used for airports API responses
  interface SimpleAirport {
    iata_code: string;
    name: string;
    name_arbic?: string;
    municipality?: string;
    municipality_arbic?: string;
    country?: string;
    country_arbic?: string;
  }
  const [airportsMap, setAirportsMap] = useState<Record<string, SimpleAirport>>({});
  const [bookings, setBookings] = useState<FlightBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  // Local types to improve type-safety when reading optional fields from bookings
  interface SelectedFlight {
    flightId?: string;
    flightnumber?: string;
    airline?: string;
    airlineCode?: string;
    airline_code?: string;
    airlineLogo?: string;
    airline_logo_url?: string;
    departureTime?: string;
    arrivalTime?: string;
    price?: { total: number; currency: string };
    class?: string;
  }
  interface FlightDetailsLocal {
    from?: string;
    to?: string;
    fromIata?: string;
    toIata?: string;
    departureDate?: string;
    passengers?: { adults: number; children: number; infants: number };
    selectedFlight?: SelectedFlight;
  }

  const fetchBookings = useCallback(async () => {
    try {
      // Get items from localStorage first
      const localItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      
      // Convert local items to FlightBooking format
      const localBookings: FlightBooking[] = localItems.map((item: LocalCartItem & { fromIata?: string; toIata?: string; airlineCode?: string; airlineLogo?: string }, index: number) => ({
        _id: `local_${index}`,
        bookingId: `LOCAL-${index + 1000}`,
        customerName: 'Guest User',
        customerEmail: '',
        flightDetails: {
          from: item.from,
          to: item.to,
          fromIata: item.fromIata || null,
          toIata: item.toIata || null,
          departureDate: item.departureTime,
          passengers: item.passengers,
          selectedFlight: {
            flightId: item.flightId,
            airline: item.airline,
            airlineCode: item.airlineCode || null,
            airlineLogo: item.airlineLogo || null,
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
          const response = await api.get<ApiResponse>('/bookings/my');
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

  // Load airports map for localized names
  useEffect(() => {
    const loadAirports = async () => {
      try {
        const lang = i18n.language === 'ar' ? 'ar' : 'en';
        const resp = await api.get(`/airports?lang=${lang}`);
        if (resp.data && Array.isArray(resp.data.data)) {
          const map: Record<string, SimpleAirport> = {};
          resp.data.data.forEach((a: SimpleAirport) => {
            if (a.iata_code) map[a.iata_code] = a;
          });
          setAirportsMap(map);
        }
      } catch (err) {
        console.error('Failed to load airports for Cart:', err);
      }
    };
    loadAirports();
  }, [i18n.language]);

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
        await api.delete(`/bookings/${booking._id}`);
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
      <h1 className={`text-3xl font-bold mb-8 ${i18n.language === 'ar' ? 'text-center md:text-right' : 'text-center md:text-left'}`}>
        {t('yourBookings', 'حجوزاتك')}
      </h1>

      {!bookings || bookings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">{t('noBookings', 'لا توجد حجوزات في سلة المشتريات.')}</p>
          <Button
            onClick={() => navigate('/flights')}
            className="mt-4 bg-tourtastic-blue hover:bg-tourtastic-dark-blue text-white"
          >
            {t('searchFlights', 'البحث عن رحلات')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking) => {
            // Prefer iata codes when present so we can lookup localized names from airportsMap
            const selected: SelectedFlight = (booking?.flightDetails?.selectedFlight as SelectedFlight) || {};
            const rawAirlineName: string = selected?.airline || 'Unknown Airline';
            const airlineCode: string | null = selected?.airlineCode || selected?.airline_code || null;
            const airlineLogoUrl: string | null = selected?.airlineLogo || selected?.airline_logo_url || null;
            const flightId = selected?.flightId || selected?.flightnumber || 'N/A';

            // Derive a clean, human-friendly flight number from several possible provider fields.
            // Tries multiple common keys and falls back to a sanitized version of whatever we have.
            const getCleanFlightNumber = (sel: unknown) => {
              if (!sel || typeof sel !== 'object') return 'N/A';
              const s = sel as Record<string, unknown>;

              // Safe path getter for unknown-shaped objects
              const getPath = (obj: unknown, path: Array<string | number>): string | undefined => {
                let cur: unknown = obj;
                for (const key of path) {
                  if (cur === null || cur === undefined) return undefined;
                  if (typeof key === 'number') {
                    if (!Array.isArray(cur)) return undefined;
                    cur = (cur as unknown[])[key];
                  } else {
                    if (typeof cur !== 'object') return undefined;
                    const rec = cur as Record<string, unknown>;
                    cur = rec[key];
                  }
                }
                if (cur === null || cur === undefined) return undefined;
                if (typeof cur === 'string' || typeof cur === 'number' || typeof cur === 'boolean') return String(cur);
                return undefined;
              };

              // Common fields where providers put flight number (use safe getter)
              const candidates = [
                getPath(s, ['flightId']),
                getPath(s, ['flightnumber']),
                getPath(s, ['flight_no']),
                getPath(s, ['number']),
                getPath(s, ['trip_id']),
                getPath(s, ['flightNumber']),
                getPath(s, ['raw', 'flightnumber']),
                getPath(s, ['raw', 'trip_id']),
                getPath(s, ['raw', 'legs', 0, 'segments', 0, 'flightnumber']),
                getPath(s, ['raw', 'legs', 0, 'segments', 0, 'flight_no'])
              ].filter(Boolean) as string[];

              // Try to find a clear airline-code + number pattern like 'AI123' or 'AI-123'
              const pattern = /[A-Z]{1,3}\s*-?\s*\d{1,4}/i;
              for (const c of candidates) {
                if (!c) continue;
                // If candidate is long JSON or contains braces, try to extract pattern
                if (pattern.test(c)) {
                  const m = c.match(pattern);
                  if (m && m[0]) return m[0].replace(/\s+/g, '').toUpperCase();
                }
              }

              // If nothing matched, fall back to the first short alphanumeric chunk we can extract
              for (const c of candidates) {
                if (!c) continue;
                const short = c.match(/[A-Za-z0-9-]{2,10}/);
                if (short) return short[0].toUpperCase();
              }

              return 'N/A';
            };

            const cleanFlightNumber = getCleanFlightNumber(selected);

            const fd: FlightDetailsLocal = booking?.flightDetails as FlightDetailsLocal || {};
            const fromIata = fd?.fromIata || fd?.from || null;
            const toIata = fd?.toIata || fd?.to || null;

            const departureDate = booking?.flightDetails?.departureDate;
            const passengers = booking?.flightDetails?.passengers || { adults: 0, children: 0, infants: 0 };
            const cabinClass = selected?.class || booking?.flightDetails?.selectedFlight?.class || 'N/A';
            const status = booking?.status || 'pending';
            const price = selected?.price || booking?.flightDetails?.selectedFlight?.price || { total: 0, currency: 'USD' };
            const paymentStatus = booking?.paymentDetails?.status || 'pending';

            // Helper: get airport display name (prefer Arabic when available)
            const getAirportDisplay = (iataOrText: string | null) => {
              if (!iataOrText) return 'N/A';
              const code = typeof iataOrText === 'string' && iataOrText.length === 3 ? iataOrText.toUpperCase() : null;
              if (code && airportsMap[code]) {
                const a = airportsMap[code];
                if (i18n.language === 'ar') {
                  const name = a.name_arbic || a.name || '';
                  const city = a.municipality_arbic || a.municipality || '';
                  return `${a.iata_code} - ${name}${city ? ` (${city})` : ''}`;
                }
                const nameEn = a.name || a.name_arbic || '';
                const cityEn = a.municipality || a.municipality_arbic || '';
                return `${a.iata_code} - ${nameEn}${cityEn ? ` (${cityEn})` : ''}`;
              }
              // fallback: show raw string (could be a city name or full label)
              return iataOrText;
            };

            // Airline display translation mapping (keeps same names as used elsewhere)
            const airlineTranslations: Record<string, string> = {
              'Flynas': 'طيران ناس',
              'flyadeal': 'طيران أديل',
              'Air Arabia': 'العربية للطيران',
              'EgyptAir': 'مصر للطيران',
              'Emirates': 'طيران الإمارات',
              'Ethiopian Airlines': 'الخطوط الإثيوبية',
              'Etihad Airways': 'الاتحاد للطيران',
              'FlyDubai': 'فلاي دبي',
              'Gulf Air': 'طيران الخليج',
              'Jazeera Airways': 'طيران الجزيرة',
              'Kuwait Airways': 'الخطوط الكويتية',
              'Oman Air': 'الطيران العماني',
              'Qatar Airways': 'الخطوط القطرية',
              'Royal Jordanian': 'الملكية الأردنية',
              'Saudi Arabian Airlines': 'الخطوط السعودية',
              'Turkish Airlines': 'الخطوط التركية'
            };

            const airlineDisplay = i18n.language === 'ar' ? (airlineTranslations[rawAirlineName] || rawAirlineName) : rawAirlineName;

            // Resolve airline logo with fallbacks: provided URL -> airlineCode-based asset -> name-based asset -> placeholder
            const normalizedNameForFile = rawAirlineName.replace(/\s+/g, '-');
            const candidateLogoSrc = airlineLogoUrl || (airlineCode ? `/${airlineCode}-Logo.png` : null) || (rawAirlineName ? `/${normalizedNameForFile}-Logo.png` : null) || '/placeholder.svg';

            return (
              <Card key={booking._id} className="p-4 md:p-6 bg-gradient-to-br from-white to-gray-50 border-2 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row justify-between gap-6">
                    {/* Flight Details */}
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-4 mb-6 bg-tourtastic-blue bg-opacity-10 p-6 rounded-lg">
                        <div className="relative h-24 w-24 flex-shrink-0">
                          <img
                            src={candidateLogoSrc}
                            alt={`${airlineDisplay} logo`}
                            className="object-contain w-full h-full"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (target.src && !target.src.endsWith('/placeholder.svg')) {
                                target.src = '/placeholder.svg';
                              }
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-xl font-bold text-tourtastic-blue">{airlineDisplay}</h2>
                        <div className={`flex items-center gap-2 ${i18n.language === 'ar' ? 'justify-end' : ''}`}>
                          <span className="text-sm font-medium text-gray-600">{i18n.language === 'ar' ? `رحلة ${cleanFlightNumber}` : `Flight ${cleanFlightNumber}`}</span>
                        </div>
                      </div>
                    </div>                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-4 rounded-lg shadow-sm">
                        <div className={`${i18n.language === 'ar' ? 'border-l' : 'border-r'} border-gray-200 ${i18n.language === 'ar' ? 'pl-4' : 'pr-4'}`}>
                          <div className={`flex items-center ${i18n.language === 'ar' ? 'flex-row-reverse' : ''} gap-2 text-tourtastic-blue mb-2`}>
                            <Calendar className="h-4 w-4" />
                            <div className="text-sm font-medium">{t('route', 'المسار')}</div>
                          </div>
                          <div className={`font-semibold text-lg ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                            <span className="text-gray-700">{getAirportDisplay(fromIata)}</span>
                            <span className="mx-2 text-tourtastic-blue">{i18n.language === 'ar' ? '←' : '→'}</span>
                            <span className="text-gray-700">{getAirportDisplay(toIata)}</span>
                          </div>
                        </div>

                        <div className={`${i18n.language === 'ar' ? 'border-l' : 'border-r'} border-gray-200 ${i18n.language === 'ar' ? 'pl-4' : 'pr-4'}`}>
                          <div className={`flex items-center ${i18n.language === 'ar' ? 'flex-row-reverse' : ''} gap-2 text-tourtastic-blue mb-2`}>
                            <Calendar className="h-4 w-4" />
                            <div className="text-sm font-medium">{t('departure', 'موعد المغادرة')}</div>
                          </div>
                          <div className={`font-semibold text-lg text-gray-700 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                            {departureDate ? format(new Date(departureDate), i18n.language === 'ar' ? 'yyyy/MM/dd hh:mm a' : 'MMM dd, yyyy hh:mm a') : 'N/A'}
                          </div>
                        </div>

                        <div>
                          <div className={`flex items-center ${i18n.language === 'ar' ? 'flex-row-reverse' : ''} gap-2 text-tourtastic-blue mb-2`}>
                            <Users className="h-4 w-4" />
                            <div className="text-sm font-medium">{t('passengers', 'المسافرون')}</div>
                          </div>
                          <div className={`font-semibold text-lg text-gray-700 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                            {passengers.adults} {t('adults', 'بالغ')}
                            {passengers.children > 0 && ` ${i18n.language === 'ar' ? '، ' : ', '}${passengers.children} ${t('children', 'طفل')}`}
                            {passengers.infants > 0 && ` ${i18n.language === 'ar' ? '، ' : ', '}${passengers.infants} ${t('infants', 'رضيع')}`}
                          </div>
                        </div>
                      </div>                      <div className="mt-6 flex flex-wrap gap-4">
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
                                  return t('economy', 'الدرجة السياحية');
                                case 'w':
                                case 'pe':
                                case 'premium_economy':
                                  return t('premiumEconomy', 'الدرجة السياحية المميزة');
                                case 'c':
                                case 'b':
                                case 'business':
                                  return t('business', 'درجة رجال الأعمال');
                                case 'f':
                                case 'first':
                                  return t('first', 'الدرجة الأولى');
                                default:
                                  // If it's a single letter or short code, try to map it to a full name
                                  if (classCode.length <= 2) {
                                    return t('economy', 'الدرجة السياحية'); // Default to Economy if unknown short code
                                  }
                                  return t(classCode, i18n.language === 'ar' ? 'الدرجة السياحية' : classCode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
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
                          }`}>
                            {status === 'pending' ? t('pending', 'قيد الانتظار') :
                             status === 'confirmed' ? t('confirmed', 'مؤكد') :
                             status}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Price and Actions */}
                    <div className="lg:w-72 flex flex-col justify-between items-center md:items-end">
                      <div className="w-full bg-tourtastic-blue bg-opacity-10 rounded-lg p-4 text-center md:text-right mb-4">
                        <div className={`text-sm font-medium text-tourtastic-blue mb-1 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                        {t('totalPrice', 'السعر الإجمالي')}
                      </div>
                      <div className={`text-3xl font-bold text-tourtastic-blue ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                        {i18n.language === 'ar' ? `${price.total} ${price.currency}` : `${price.currency} ${price.total}`}
                      </div>
                      </div>

                      <div className="flex flex-col gap-3 w-full">
                        <Button
                          onClick={() => handleProceedToPayment(booking)}
                          className={`w-full bg-tourtastic-blue hover:bg-tourtastic-dark-blue text-white flex items-center justify-center gap-2 py-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}
                          disabled={paymentStatus === 'completed' || processingPayment === booking._id}
                        >
                          <CreditCard className="h-5 w-5" />
                          {processingPayment === booking._id ? (
                            <span className="animate-pulse text-lg">{t('processing', 'جارٍ المعالجة...')}</span>
                          ) : paymentStatus === 'completed' ? (
                            <span className="text-lg">{t('paid', 'تم الدفع')}</span>
                          ) : (
                            <span className="text-lg">{t('proceedToPayment', 'المتابعة للدفع')}</span>
                          )}
                        </Button>

                        <Button
                          onClick={() => handleDelete(booking)}
                          variant="outline"
                          className={`w-full text-red-500 hover:text-red-600 hover:bg-red-50 py-4 rounded-lg border-2 border-red-200 hover:border-red-400 transition-all duration-300 flex items-center justify-center gap-2 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}
                          disabled={status !== 'pending' || processingPayment === booking._id}
                        >
                          <Trash2 className="h-5 w-5" />
                          <span className="text-lg">{t('delete', 'حذف')}</span>
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
