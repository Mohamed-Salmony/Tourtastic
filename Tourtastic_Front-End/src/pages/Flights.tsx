import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flight, searchFlights, getSearchResults } from '@/services/flightService';
import { toast } from '@/hooks/use-toast';

// Form schema
const searchFormSchema = z.object({
  from: z.string().min(2, { message: 'Please enter departure city' }),
  to: z.string().min(2, { message: 'Please enter destination city' }),
  departureDate: z.date({ required_error: 'Please select departure date' }),
  returnDate: z.date().optional(),
  passengers: z.string().min(1, { message: 'Please select number of passengers' }),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

const Flights = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [hasSearched, setHasSearched] = useState(false);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      from: '',
      to: '',
      passengers: '1',
    },
  });

  const departureDate = watch('departureDate');
  const returnDate = watch('returnDate');

  const pollSearchResults = useCallback(async (searchId: string, maxAttempts = 5) => {
    setIsPolling(true);
    let attempts = 0;
    
    const poll = async () => {
      try {
        const results = await getSearchResults(searchId);
        if (results.success && results.data.flights.length > 0) {
          setFlights(results.data.flights);
          setHasSearched(true);
          setIsPolling(false);
          setIsLoading(false);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 2000); // Wait 2 seconds before trying again
        } else {
          throw new Error('Could not get flight results after multiple attempts');
        }
      } catch (error) {
        setIsPolling(false);
        setIsLoading(false);
        toast({
          title: t('error', 'Error'),
          description: t('flightSearchError', 'Failed to fetch flight results. Please try again.'),
          variant: 'destructive',
        });
      }
    };

    await poll();
  }, [t]);

  const onSubmit = useCallback(async (data: SearchFormValues) => {
    try {
      setIsLoading(true);
      
      const searchParams = {
        from: data.from,
        to: data.to,
        departureDate: data.departureDate.toISOString(),
        returnDate: data.returnDate?.toISOString(),
        adults: parseInt(data.passengers),
        children: 0,
        infants: 0,
      };

      const response = await searchFlights(searchParams);
      
      if (response.success && response.data.searchId) {
        await pollSearchResults(response.data.searchId);
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
      const { from, to, departureDate: departureDateParam, returnDate: returnDateParam, passengers } = location.state;
      if (from) setValue('from', from);
      if (to) setValue('to', to);
      if (departureDateParam) setValue('departureDate', new Date(departureDateParam));
      if (returnDateParam) setValue('returnDate', new Date(returnDateParam));
      if (passengers) setValue('passengers', passengers);

      // Auto submit if we have all required fields
      if (from && to && departureDateParam) {
        const formData = {
          from,
          to,
          departureDate: new Date(departureDateParam),
          returnDate: returnDateParam ? new Date(returnDateParam) : undefined,
          passengers: passengers || '1',
        };
        onSubmit(formData);
      }
    }
  }, [location.state, setValue, onSubmit]);

  useEffect(() => {
    // Check if there are saved search parameters in the URL
    const params = new URLSearchParams(location.search);
    const from = params.get('from');
    const to = params.get('to');
    const departureDateParam = params.get('departureDate');
    const returnDateParam = params.get('returnDate');
    const passengers = params.get('passengers');

    if (from && to && departureDateParam && passengers) {
      // If all required parameters are present, set them in the form
      setValue('from', from);
      setValue('to', to);
      setValue('departureDate', new Date(departureDateParam));
      setValue('returnDate', returnDateParam ? new Date(returnDateParam) : null);
      setValue('passengers', passengers);
    }
  }, [location.search, setValue]);

  return (
    <Layout>
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
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* From */}
              <div className="space-y-2">
                <Label htmlFor="from">{t('from', 'From')}</Label>
                <Input
                  id="from"
                  placeholder={t('departureCity', 'Departure city')}
                  {...register('from')}
                />
                {errors.from && (
                  <p className="text-sm text-destructive">{errors.from.message}</p>
                )}
              </div>

              {/* To */}
              <div className="space-y-2">
                <Label htmlFor="to">{t('to', 'To')}</Label>
                <Input
                  id="to"
                  placeholder={t('destinationCity', 'Destination city')}
                  {...register('to')}
                />
                {errors.to && (
                  <p className="text-sm text-destructive">{errors.to.message}</p>
                )}
              </div>

              {/* Departure Date */}
              <div className="space-y-2">
                <Label htmlFor="departureDate">{t('departure', 'Departure Date')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="departureDate"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !departureDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {departureDate ? format(departureDate, "PPP") : <span>{t('pickDate', 'Pick a date')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={departureDate}
                      onSelect={(date) => date && setValue('departureDate', date)}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                {errors.departureDate && (
                  <p className="text-sm text-destructive">{errors.departureDate.message}</p>
                )}
              </div>

              {/* Return Date */}
              <div className="space-y-2">
                <Label htmlFor="returnDate">{t('return', 'Return Date (Optional)')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="returnDate"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !returnDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {returnDate ? format(returnDate, "PPP") : <span>{t('pickDate', 'Pick a date')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={returnDate}
                      onSelect={(date) => setValue('returnDate', date)}
                      disabled={(date) => date < (departureDate || new Date())}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Passengers */}
              <div className="space-y-2">
                <Label htmlFor="passengers">{t('passengers', 'Passengers')}</Label>
                <Select defaultValue="1" onValueChange={(value) => setValue('passengers', value)}>
                  <SelectTrigger id="passengers" className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Passengers</SelectLabel>
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? 'passenger' : 'passengers'}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.passengers && (
                  <p className="text-sm text-destructive">{errors.passengers.message}</p>
                )}
              </div>

              {/* Search Button */}
              <div className="mt-6 col-span-1 md:col-span-2 lg:col-span-5">
                <Button 
                  type="submit" 
                  className="w-full md:w-auto md:px-8" 
                  disabled={isLoading}
                >
                  {isLoading ? t('searching', 'Searching...') : t('searchFlights', 'Search Flights')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Results or Initial State */}
      <div className="py-8 container-custom">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-tourtastic-blue mx-auto mb-4"></div>
            <p className="text-lg font-medium">
              {isPolling 
                ? t('processingResults', 'Processing your search results...')
                : t('searchingForBestFlights', 'Searching for the best flights...')}
            </p>
          </div>
        ) : hasSearched ? (
          <>
            <h2 className="text-2xl font-bold mb-6">{t('flightResults', 'Flight Results')}</h2>
            <div className="space-y-4">
              {flights.map((flight) => (
                <Card 
                  key={flight.flightId} 
                  className={cn(
                    "overflow-hidden transition-shadow hover:shadow-lg",
                    selectedFlight?.flightId === flight.flightId && "ring-2 ring-tourtastic-blue"
                  )}
                >
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-6">
                      {/* Airline */}
                      <div className="flex items-center">
                        <div>
                          <p className="font-bold">{flight.airline}</p>
                          <p className="text-sm text-gray-500">{flight.flightId}</p>
                        </div>
                      </div>

                      {/* Departure/Arrival */}
                      <div className="col-span-2 flex flex-col justify-center">
                        <div className="flex justify-between items-center">
                          <div className="text-center">
                            <p className="font-bold text-lg">
                              {new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-sm text-gray-500">{flight.departureAirport}</p>
                          </div>
                          
                          <div className="flex-1 mx-4 relative">
                            <div className="border-t border-gray-300 my-3"></div>
                            <div className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 bg-white px-2 text-xs text-gray-500">
                              {flight.duration}
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <p className="font-bold text-lg">
                              {new Date(flight.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-sm text-gray-500">{flight.arrivalAirport}</p>
                          </div>
                        </div>
                        <div className="mt-4 text-center space-y-1">
                          <div className="text-sm text-gray-500">{flight.class}</div>
                          {flight.layovers.length > 0 && (
                            <div className="text-xs text-gray-500">
                              {flight.layovers.length} {t('stop', 'Stop')} ({flight.layovers.map(l => l.airport).join(', ')})
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex flex-col justify-center items-center">
                        <p className="font-bold text-lg text-tourtastic-blue">${flight.price.total}</p>
                        <p className="text-sm text-gray-500">{t('perPerson', 'per person')}</p>
                      </div>

                      {/* Select Button */}
                      <div className="flex items-center justify-center">
                        <Button 
                          variant={selectedFlight?.flightId === flight.flightId ? "secondary" : "default"}
                          onClick={() => setSelectedFlight(selectedFlight?.flightId === flight.flightId ? null : flight)}
                        >
                          {selectedFlight?.flightId === flight.flightId ? t('selected', 'Selected') : t('select', 'Select')}
                        </Button>
                      </div>
                    </div>

                    {/* Booking Details Section */}
                    {selectedFlight?.flightId === flight.flightId && (
                      <div className="border-t border-gray-200 p-6 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <h4 className="font-medium mb-2">{t('flightDetails', 'Flight Details')}</h4>
                            <div className="text-sm space-y-1">
                              <p><span className="text-gray-500">{t('airline', 'Airline')}:</span> {flight.airline}</p>
                              <p><span className="text-gray-500">{t('flightNumber', 'Flight Number')}:</span> {flight.flightId}</p>
                              <p><span className="text-gray-500">{t('class', 'Class')}:</span> {flight.class}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">{t('priceBreakdown', 'Price Breakdown')}</h4>
                            <div className="text-sm space-y-1">
                              <p><span className="text-gray-500">{t('adultPrice', 'Adult Price')}:</span> ${flight.price.adult}</p>
                              {flight.price.child > 0 && (
                                <p><span className="text-gray-500">{t('childPrice', 'Child Price')}:</span> ${flight.price.child}</p>
                              )}
                              <p className="font-medium pt-1">{t('total', 'Total')}: ${flight.price.total}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">{t('availableSeats', 'Available Seats')}</h4>
                            <p className="text-sm">{flight.availableSeats} {t('seatsLeft', 'seats left')}</p>
                            <Button className="mt-4 w-full" onClick={() => {/* Add booking logic */}}>
                              {t('continueToBooking', 'Continue to Booking')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-bold mb-4">{t('findYourPerfectFlight', 'Find Your Perfect Flight')}</h3>
              <p className="text-gray-600 mb-6">
                {t('useSearchFormAbove', 'Use the search form above to find flights to your desired destination. Enter your departure city, destination, dates, and number of passengers to get started.')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-4">
                  <div className="w-12 h-12 bg-tourtastic-light-blue rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-tourtastic-blue font-bold">1</span>
                  </div>
                  <h4 className="font-bold mb-1">{t('search', 'Search')}</h4>
                  <p className="text-sm text-gray-500">{t('enterTravelDetails', 'Enter your travel details')}</p>
                </div>
                <div className="p-4">
                  <div className="w-12 h-12 bg-tourtastic-light-blue rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-tourtastic-blue font-bold">2</span>
                  </div>
                  <h4 className="font-bold mb-1">{t('compare', 'Compare')}</h4>
                  <p className="text-sm text-gray-500">{t('viewFlightsPrices', 'View flights and prices')}</p>
                </div>
                <div className="p-4">
                  <div className="w-12 h-12 bg-tourtastic-light-blue rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-tourtastic-blue font-bold">3</span>
                  </div>
                  <h4 className="font-bold mb-1">{t('book', 'Book')}</h4>
                  <p className="text-sm text-gray-500">{t('secureReservation', 'Secure your reservation')}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Flights;
