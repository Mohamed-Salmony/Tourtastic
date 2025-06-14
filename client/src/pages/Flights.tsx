import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Plane, Clock, ShoppingCart, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flight, searchFlights, getSearchResults } from '@/services/flightService';
import { toast } from '@/hooks/use-toast';
import { api } from '@/config/api';

// Form schema
const searchFormSchema = z.object({
  flightSegments: z.array(z.object({
    from: z.string().min(2, { message: 'Please enter departure city' }),
    to: z.string().min(2, { message: 'Please enter destination city' }),
    date: z.date({ required_error: 'Please select departure date' }),
  })),
  passengers: z.object({
    adults: z.number().min(1, { message: 'At least one adult is required' }),
    children: z.number().min(0),
    infants: z.number().min(0),
  }),
  cabin: z.enum(['e', 'p', 'b', 'f']).optional(),
  direct: z.boolean().optional(),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

const Flights = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [hasSearched, setHasSearched] = useState(false);
  const [flights, setFlights] = useState<Record<string, Flight>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchId, setSearchId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      flightSegments: [{ from: '', to: '', date: undefined }],
      passengers: {
        adults: 1,
        children: 0,
        infants: 0,
      },
      cabin: 'e',
      direct: false,
    },
  });

  const flightSegments = watch('flightSegments');
  const passengers = watch('passengers');
  const cabin = watch('cabin');
  const direct = watch('direct');

  const pollSearchResults = useCallback(async (id: string, lastAfter?: number) => {
    if (!id) return;
    
    try {
      const results = await getSearchResults(id, lastAfter);
      
      // Update search progress
      setSearchProgress(results.complete);
      
      // Update flights with new or updated results
      if (results.result && results.result.length > 0) {
        setFlights(prevFlights => {
          const updatedFlights = { ...prevFlights };
          results.result.forEach(flight => {
            updatedFlights[flight.trip_id] = flight;
          });
          return updatedFlights;
        });
      }

      // If search is not complete, continue polling
      if (results.complete < 100) {
        setTimeout(() => pollSearchResults(id, results.last_result), 2000);
      } else {
        setIsPolling(false);
        setIsLoading(false);
        setHasSearched(true);
      }
    } catch (error) {
      console.error('Error polling search results:', error);
      setIsPolling(false);
      setIsLoading(false);
      toast({
        title: t('error', 'Error'),
        description: t('flightSearchError', 'Failed to fetch flight results. Please try again.'),
        variant: 'destructive',
      });
    }
  }, [t]);

  const onSubmit = useCallback(async (data: SearchFormValues) => {
    try {
      setIsLoading(true);
      setFlights({});
      setSearchProgress(0);
      setSearchId(null);
      
      const searchParams = {
        flightSegments: data.flightSegments.map(segment => ({
          from: segment.from,
          to: segment.to,
          date: segment.date instanceof Date && !isNaN(segment.date.getTime()) ? format(segment.date, 'yyyy-MM-dd') : '',
        })),
        passengers: data.passengers,
        cabin: data.cabin,
        direct: data.direct,
      };

      const response = await searchFlights(searchParams);
      
      if (response.search_id) {
        setSearchId(response.search_id);
        setIsPolling(true);
        await pollSearchResults(response.search_id);
      } else {
        throw new Error('Search initialization failed');
      }
    } catch (error) {
      setIsLoading(false);
      toast({
        title: t('error', 'Error'),
        description: t('flightSearchError', 'Failed to search for flights. Please try again.'),
        variant: 'destructive',
      });
    }
  }, [pollSearchResults, t]);

  // Handle search params from home page
  useEffect(() => {
    if (location.state) {
      const { flightSegments: segments, passengers: passengerCounts } = location.state;
      
      if (segments && segments.length > 0) {
        setValue('flightSegments', segments.map((segment: any) => ({
          ...segment,
          date: new Date(segment.date),
        })));
      }
      
      if (passengerCounts) {
        setValue('passengers', passengerCounts);
      }

      // Auto submit if we have all required fields
      if (segments && segments.length > 0 && segments.every((segment: any) => segment.from && segment.to && segment.date)) {
        onSubmit({
          flightSegments: segments.map((segment: any) => ({
            ...segment,
            date: new Date(segment.date),
          })),
          passengers: passengerCounts || { adults: 1, children: 0, infants: 0 },
          cabin: 'e',
          direct: false,
        });
      }
    }
  }, [location.state, setValue, onSubmit]);

  // Effect to handle polling when searchId changes
  useEffect(() => {
    if (searchId && isPolling) {
      pollSearchResults(searchId);
    }
  }, [searchId, isPolling, pollSearchResults]);

  const handleFlightSelection = async (flight: Flight) => {
    setSelectedFlight(flight);
    setShowDetails(flight.trip_id);
  };

  const handleAddToCart = async (flight: Flight) => {
    try {
      const response = await api.post('/flights/bookings', {
        flightDetails: {
          from: flight.legs[0].from.city,
          to: flight.legs[0].to.city,
          departureDate: flight.legs[0].from.date,
          passengers: {
            adults: flight.search_query.adt || 1,
            children: flight.search_query.chd || 0,
            infants: flight.search_query.inf || 0
          },
          selectedFlight: {
            flightId: flight.legs[0].segments[0].flightnumber,
            airline: flight.legs[0].segments[0].airline_name,
            departureTime: flight.legs[0].from.date,
            arrivalTime: flight.legs[0].to.date,
            price: {
              total: flight.price,
              currency: flight.currency
            },
            class: flight.search_query.options.cabin || 'economy'
          }
        }
      });

      if (response.data.success) {
        toast({
          title: t('success', 'Success'),
          description: t('flightAddedToCart', 'Flight has been added to your cart'),
        });
        navigate('/cart');
      }
    } catch (error) {
      toast({
        title: t('error', 'Error'),
        description: t('addToCartError', 'Failed to add flight to cart. Please try again.'),
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 py-12">
        <div className="container-custom">
          <h1 className="text-4xl font-bold mb-4">{t('flights', 'Flights')}</h1>
          <p className="text-gray-600 max-w-2xl">
            {t('findAndBook', 'Find and book flights to your favorite destinations. Compare prices and find the best deals.')}
          </p>
        </div>
      </div>

      {/* Search Form */}
      <div className="py-8 container-custom">
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Flight Segments */}
              <div className="space-y-4">
                {flightSegments.map((segment, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor={`from-${index}`}>{t('from', 'From')}</Label>
                      <Input
                        id={`from-${index}`}
                        placeholder={t('departureCity', 'Departure city')}
                        {...register(`flightSegments.${index}.from`)}
                      />
                      {errors.flightSegments?.[index]?.from && (
                        <p className="text-sm text-destructive">{errors.flightSegments[index]?.from?.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`to-${index}`}>{t('to', 'To')}</Label>
                      <Input
                        id={`to-${index}`}
                        placeholder={t('destinationCity', 'Destination city')}
                        {...register(`flightSegments.${index}.to`)}
                      />
                      {errors.flightSegments?.[index]?.to && (
                        <p className="text-sm text-destructive">{errors.flightSegments[index]?.to?.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`date-${index}`}>{t('date', 'Date')}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id={`date-${index}`}
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !segment.date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {segment.date ? (segment.date instanceof Date && !isNaN(segment.date.getTime()) ? format(segment.date, "PPP") : <span>{t('pickDate', 'Pick a date')}</span>) : <span>{t('pickDate', 'Pick a date')}</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={segment.date}
                            onSelect={(date) => date && setValue(`flightSegments.${index}.date`, date)}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.flightSegments?.[index]?.date && (
                        <p className="text-sm text-destructive">{errors.flightSegments[index]?.date?.message}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Passenger Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>{t('adults', 'Adults')}</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('passengers.adults', Math.max(1, passengers.adults - 1))}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center">{passengers.adults}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('passengers.adults', passengers.adults + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('children', 'Children')}</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('passengers.children', Math.max(0, passengers.children - 1))}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center">{passengers.children}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('passengers.children', passengers.children + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('infants', 'Infants')}</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('passengers.infants', Math.max(0, passengers.infants - 1))}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center">{passengers.infants}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('passengers.infants', passengers.infants + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>

              {/* Cabin Class and Direct Flights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>{t('cabinClass', 'Cabin Class')}</Label>
                  <Select value={cabin} onValueChange={(value) => setValue('cabin', value as 'e' | 'p' | 'b' | 'f')}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectCabin', 'Select cabin class')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="e">{t('economy', 'Economy')}</SelectItem>
                      <SelectItem value="p">{t('premiumEconomy', 'Premium Economy')}</SelectItem>
                      <SelectItem value="b">{t('business', 'Business')}</SelectItem>
                      <SelectItem value="f">{t('first', 'First')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('flightType', 'Flight Type')}</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={direct ? "default" : "outline"}
                      onClick={() => setValue('direct', true)}
                    >
                      {t('directOnly', 'Direct Only')}
                    </Button>
                    <Button
                      type="button"
                      variant={!direct ? "default" : "outline"}
                      onClick={() => setValue('direct', false)}
                    >
                      {t('allFlights', 'All Flights')}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Search Button */}
              <Button type="submit" className="w-full bg-tourtastic-blue hover:bg-tourtastic-dark-blue text-white">
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    {t('searching', 'Searching...')}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Plane className="h-4 w-4" />
                    {t('searchFlights', 'Search Flights')}
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      {hasSearched && (
        <div className="container-custom py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">{t('searchResults', 'Search Results')}</h2>
            {isPolling && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>{t('searchingMoreFlights', 'Searching for more flights...')} {searchProgress}%</span>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-tourtastic-blue border-t-transparent"></div>
            </div>
          ) : Object.values(flights).length > 0 ? (
            <div className="grid gap-6">
              {Object.values(flights).map((flight) => (
                <Card key={flight.trip_id} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="flex-1 w-full">
                      {flight.legs.map((leg, index) => (
                        <div key={leg.leg_id} className={index > 0 ? 'mt-6 pt-6 border-t' : ''}>
                          <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="flex items-center gap-4 min-w-[200px] justify-center sm:justify-start">
                              <div className="text-lg font-semibold">{leg.segments[0].airline_name}</div>
                              <div className="text-sm text-gray-500">{leg.segments[0].flightnumber}</div>
                            </div>
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
                              <div className="flex flex-col items-center sm:items-start">
                                <span className="text-sm text-gray-500">{t('departure', 'Departure')}</span>
                                <span className="font-medium">{format(new Date(leg.from.date), 'HH:mm')}</span>
                                <span className="text-sm">{leg.from.airport}</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="text-sm text-gray-500">{t('duration', 'Duration')}</span>
                                <span className="font-medium">{Math.floor(leg.duration / 60)}h {leg.duration % 60}m</span>
                                <div className="w-full h-px bg-gray-200 my-2"></div>
                                <span className="text-xs text-gray-500">{leg.segments.length === 1 ? t('direct', 'Direct') : `${leg.segments.length - 1} ${t('stops', 'stops')}`}</span>
                              </div>
                              <div className="flex flex-col items-center sm:items-end">
                                <span className="text-sm text-gray-500">{t('arrival', 'Arrival')}</span>
                                <span className="font-medium">{format(new Date(leg.to.date), 'HH:mm')}</span>
                                <span className="text-sm">{leg.to.airport}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col items-center lg:items-end gap-3 w-full lg:w-auto lg:min-w-[200px]">
                      <div className="text-2xl font-bold text-center lg:text-right">
                        {flight.currency} {flight.price}
                      </div>
                      <div className="text-sm text-gray-500 text-center lg:text-right">
                        {t('perPerson', 'per person')}
                      </div>
                      <Button
                        onClick={() => handleFlightSelection(flight)}
                        className="w-full lg:w-auto bg-tourtastic-blue hover:bg-tourtastic-dark-blue text-white transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                      >
                        {selectedFlight?.trip_id === flight.trip_id ? (
                          <div className="flex items-center gap-2">
                            <span>✓</span>
                            {t('selected', 'Selected')}
                          </div>
                        ) : (
                          t('select', 'Select')
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Flight Details Section */}
                  {showDetails === flight.trip_id && (
                    <div className="mt-6 pt-6 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Info className="h-5 w-5 text-tourtastic-blue" />
                            {t('flightDetails', 'Flight Details')}
                          </h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-500">{t('cabinClass', 'Cabin Class')}</span>
                              <span>{flight.legs[0].cabin_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">{t('baggageAllowance', 'Baggage Allowance')}</span>
                              <span>{flight.legs[0].bags.ADT.checked.desc}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">{t('refundable', 'Refundable')}</span>
                              <span>{flight.refundable_info}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col justify-between">
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold">{t('priceBreakdown', 'Price Breakdown')}</h3>
                            <div className="flex justify-between">
                              <span className="text-gray-500">{t('baseFare', 'Base Fare')}</span>
                              <span>{flight.currency} {flight.price}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">{t('taxes', 'Taxes')}</span>
                              <span>{flight.currency} {flight.tax}</span>
                            </div>
                            <div className="flex justify-between font-semibold border-t pt-2">
                              <span>{t('total', 'Total')}</span>
                              <span>{flight.currency} {flight.price + flight.tax}</span>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleAddToCart(flight)}
                            className="mt-4 bg-tourtastic-blue hover:bg-tourtastic-dark-blue text-white flex items-center justify-center gap-2"
                          >
                            <ShoppingCart className="h-4 w-4" />
                            {t('addToCart', 'Add to Cart')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">{t('noFlightsFound', 'No flights found matching your criteria.')}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Flights;
