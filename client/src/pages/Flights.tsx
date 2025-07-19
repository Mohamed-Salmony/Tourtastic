import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Plane, Clock, ShoppingCart, Info, Sun, Moon, CloudSun, CloudMoon, ArrowRightLeft, Filter, Luggage } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flight, searchFlights, getSearchResults, FlightSearchParams } from '@/services/flightService';
import { toast } from '@/hooks/use-toast';
import api from '@/config/api';
import { Airport } from '@/services/airportService';
import FlightResults from '@/components/flights/FlightResults';
import PlaneAnimation from '@/components/ui/PlaneAnimation';

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

// Helper function for time of day filtering
function getTimeOfDay(dateStr: string) {
  const hour = new Date(dateStr).getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

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
  const [sortBy, setSortBy] = useState<'price' | 'duration'>('price');
  const [stopsFilter, setStopsFilter] = useState<'all' | 'direct' | '1' | '2+'>('all');
  const [timeOfDayFilter, setTimeOfDayFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening' | 'night'>('all');
  const [baggageFilter, setBaggageFilter] = useState<string>('all');
  const [airlineFilter, setAirlineFilter] = useState<string>('all');
  const [fromSuggestions, setFromSuggestions] = useState<Airport[]>([]);
  const [toSuggestions, setToSuggestions] = useState<Airport[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const [fromDisplayValues, setFromDisplayValues] = useState<string[]>([]);
  const [toDisplayValues, setToDisplayValues] = useState<string[]>([]);
  const [datePickerOpen, setDatePickerOpen] = useState<boolean[]>([false]);
  const [visibleFlightsPerSegment, setVisibleFlightsPerSegment] = useState<{[key: number]: number}>({});
  const INITIAL_FLIGHTS_PER_SEGMENT = 3;

  const { register, handleSubmit, formState: { errors }, setValue, watch, trigger } = useForm<SearchFormValues>({
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
        passengers: {
          adults: data.passengers.adults ?? 1,
          children: data.passengers.children ?? 0,
          infants: data.passengers.infants ?? 0,
        },
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
        setValue('flightSegments', segments.map((segment: Partial<Airport> & { from: string; to: string; date: string | Date }) => ({
          ...segment,
          date: new Date(segment.date),
        })));
      }
      
      if (passengerCounts) {
        setValue('passengers', passengerCounts);
      }

      // Auto submit if we have all required fields
      if (segments && segments.length > 0 && segments.every((segment: Partial<Airport> & { from: string; to: string; date: string | Date }) => segment.from && segment.to && segment.date)) {
        onSubmit({
          flightSegments: segments.map((segment: Partial<Airport> & { from: string; to: string; date: string | Date }) => ({
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
      // Always try to add to cart, regardless of authentication status
      const response = await api.post('/cart', {
        flightDetails: {
          from: flight.legs[0].from.city,
          to: flight.legs[0].to.city,
          departureDate: flight.legs[0].from.date,
          passengers: {
            adults: flight.search_query?.adt || 1,
            children: flight.search_query?.chd || 0,
            infants: flight.search_query?.inf || 0
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
            class: flight.search_query?.options?.cabin || 'economy'
          }
        }
      });

      if (response.data.success) {
        // Store session ID for anonymous users
        if (response.data.sessionId) {
          localStorage.setItem('sessionId', response.data.sessionId);
        }

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

  // Filtering and sorting logic
  const filteredFlights = Object.values(flights)
    .filter(flight => {
      // Airline filter - use the enhanced airline name
      if (airlineFilter !== 'all' && 
          (flight.airline_name || flight.legs[0].segments[0].airline_name) !== airlineFilter) return false;
      
      // Stops filter - use the enhanced stops count
      if (stopsFilter === 'direct' && flight.stops_count > 0) return false;
      if (stopsFilter === '1' && flight.stops_count !== 1) return false;
      if (stopsFilter === '2+' && flight.stops_count < 2) return false;
      
      // Time of day filter (first leg departure)
      if (timeOfDayFilter !== 'all') {
        const tod = getTimeOfDay(flight.legs[0].from.date);
        if (tod !== timeOfDayFilter) return false;
      }
      
      // Baggage filter - use enhanced baggage info
      if (baggageFilter !== 'all') {
        const bag = flight.baggage_allowance || flight.legs[0]?.bags?.ADT?.checked?.desc || '';
        if (!bag.includes(baggageFilter)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      // Use the enhanced duration field
      if (sortBy === 'duration') return (a.total_duration || a.legs[0].duration) - (b.total_duration || b.legs[0].duration);
      return 0;
    });

  // Group flights by segment
  const groupedFlights = filteredFlights.reduce((groups, flight) => {
    const segmentIndex = flight.segment_index || 0;
    if (!groups[segmentIndex]) {
      groups[segmentIndex] = [];
    }
    groups[segmentIndex].push(flight);
    return groups;
  }, {});

  // Function to load more flights for a specific segment
  const loadMoreFlights = (segmentIndex: number) => {
    setVisibleFlightsPerSegment(prev => ({
      ...prev,
      [segmentIndex]: (prev[segmentIndex] || INITIAL_FLIGHTS_PER_SEGMENT) + INITIAL_FLIGHTS_PER_SEGMENT
    }));
  };

  // Handlers for input changes
  const handleFromInputChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    setFromDisplayValues(values => {
      const newValues = [...values];
      newValues[index] = e.target.value;
      return newValues;
    });
    setValue(`flightSegments.${index}.from`, e.target.value);
    if (e.target.value.length > 0) {
      setShowFromSuggestions(true);
      try {
        const res = await api.get(`/airports/search?q=${encodeURIComponent(e.target.value)}`);
        setFromSuggestions(res.data.data);
      } catch {
        setFromSuggestions([]);
      }
    } else {
      setShowFromSuggestions(false);
      setFromSuggestions([]);
    }
  };
  const handleToInputChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    setToDisplayValues(values => {
      const newValues = [...values];
      newValues[index] = e.target.value;
      return newValues;
    });
    setValue(`flightSegments.${index}.to`, e.target.value);
    if (e.target.value.length > 0) {
      setShowToSuggestions(true);
      try {
        const res = await api.get(`/airports/search?q=${encodeURIComponent(e.target.value)}`);
        setToSuggestions(res.data.data);
      } catch {
        setToSuggestions([]);
      }
    } else {
      setShowToSuggestions(false);
      setToSuggestions([]);
    }
  };
  const handleFromSuggestionClick = (airport: Airport, index: number) => {
    setValue(`flightSegments.${index}.from`, airport.iata_code, { shouldValidate: true, shouldDirty: true });
    setFromDisplayValues(values => {
      const newValues = [...values];
      newValues[index] = `${airport.iata_code} - ${airport.name} (${airport.city}, ${airport.country})`;
      return newValues;
    });
    setShowFromSuggestions(false);
    trigger(`flightSegments.${index}.from`);
  };
  const handleToSuggestionClick = (airport: Airport, index: number) => {
    setValue(`flightSegments.${index}.to`, airport.iata_code, { shouldValidate: true, shouldDirty: true });
    setToDisplayValues(values => {
      const newValues = [...values];
      newValues[index] = `${airport.iata_code} - ${airport.name} (${airport.city}, ${airport.country})`;
      return newValues;
    });
    setShowToSuggestions(false);
    trigger(`flightSegments.${index}.to`);
  };

  // Update datePickerOpen state when flightSegments change
  useEffect(() => {
    setDatePickerOpen(Array(flightSegments.length).fill(false));
  }, [flightSegments.length]);

  // Initialize visible flights count for each segment
  useEffect(() => {
    const initialVisible = { ...visibleFlightsPerSegment };
    Object.keys(groupedFlights).forEach(segmentIndex => {
      const segmentNum = parseInt(segmentIndex);
      // Only set initial value if this segment doesn't already have a value
      if (!(segmentNum in initialVisible)) {
        initialVisible[segmentNum] = INITIAL_FLIGHTS_PER_SEGMENT;
      }
    });
    setVisibleFlightsPerSegment(initialVisible);
  }, [groupedFlights, visibleFlightsPerSegment]);

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
                      <div className="relative">
                        <Input
                          id={`from-${index}`}
                          ref={fromInputRef}
                          placeholder={t('departureCity', 'Departure city')}
                          value={fromDisplayValues[index] ?? segment.from ?? ''}
                          onChange={e => handleFromInputChange(e, index)}
                          autoComplete="off"
                          onFocus={() => (segment.from ?? '').length > 0 && setShowFromSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowFromSuggestions(false), 100)}
                        />
                        {showFromSuggestions && fromSuggestions.length > 0 && (
                          <ul className="absolute z-10 bg-white border w-full max-h-48 overflow-y-auto shadow-lg rounded mt-1">
                            {fromSuggestions.map((a, i) => (
                              <li
                                key={`${a.iata_code || 'unknown'}-${i}`}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                onMouseDown={() => handleFromSuggestionClick(a, index)}
                              >
                                {a.iata_code} - {a.name} ({a.city}, {a.country})
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      {errors.flightSegments?.[index]?.from && (
                        <p className="text-sm text-destructive">{errors.flightSegments[index]?.from?.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`to-${index}`}>{t('to', 'To')}</Label>
                      <div className="relative">
                        <Input
                          id={`to-${index}`}
                          ref={toInputRef}
                          placeholder={t('destinationCity', 'Destination city')}
                          value={toDisplayValues[index] ?? segment.to ?? ''}
                          onChange={e => handleToInputChange(e, index)}
                          autoComplete="off"
                          onFocus={() => (segment.to ?? '').length > 0 && setShowToSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowToSuggestions(false), 100)}
                        />
                        {showToSuggestions && toSuggestions.length > 0 && (
                          <ul className="absolute z-10 bg-white border w-full max-h-48 overflow-y-auto shadow-lg rounded mt-1">
                            {toSuggestions.map((a, i) => (
                              <li
                                key={`${a.iata_code || 'unknown'}-${i}`}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                onMouseDown={() => handleToSuggestionClick(a, index)}
                              >
                                {a.iata_code} - {a.name} ({a.city}, {a.country})
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      {errors.flightSegments?.[index]?.to && (
                        <p className="text-sm text-destructive">{errors.flightSegments[index]?.to?.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`date-${index}`}>{t('date', 'Date')}</Label>
                      <Popover open={datePickerOpen[index]} onOpenChange={open => setDatePickerOpen(prev => {
                        const arr = [...prev];
                        arr[index] = open;
                        return arr;
                      })}>
                        <PopoverTrigger asChild>
                          <Button
                            id={`date-${index}`}
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !segment.date && "text-muted-foreground"
                            )}
                            onClick={() => setDatePickerOpen(prev => {
                              const arr = [...prev];
                              arr[index] = true;
                              return arr;
                            })}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {segment.date ? (segment.date instanceof Date && !isNaN(segment.date.getTime()) ? format(segment.date, "PPP") : <span>{t('pickDate', 'Pick a date')}</span>) : <span>{t('pickDate', 'Pick a date')}</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 h-auto" align="start" side="bottom" sideOffset={4}>
                          <Calendar
                            mode="single"
                            selected={segment.date}
                            onSelect={(date) => {
                              setValue(`flightSegments.${index}.date`, date);
                              setDatePickerOpen(prev => {
                                const arr = [...prev];
                                arr[index] = false;
                                return arr;
                              });
                            }}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className={cn("p-3 pointer-events-auto min-h-[280px]")}
                            fixedWeeks
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
              <div className="p-4 border rounded-lg">
                <Label>{t('passengers', 'Passengers')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      {`${passengers.adults} ${t('adults', 'Adults')}` +
                        (passengers.children ? `, ${passengers.children} ${t('children', 'Children')}` : '') +
                        (passengers.infants ? `, ${passengers.infants} ${t('infants', 'Infants')}` : '')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>{t('adults', 'Adults')}</span>
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
                      <div className="flex items-center justify-between">
                        <span>{t('children', 'Children')}</span>
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
                      <div className="flex items-center justify-between">
                        <span>{t('infants', 'Infants')}</span>
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
                  </PopoverContent>
                </Popover>
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
                    <PlaneAnimation size="sm" />
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
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
            <h2 className="text-2xl font-semibold">{t('searchResults', 'Search Results')}</h2>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                <select value={sortBy} onChange={e => setSortBy(e.target.value as 'price' | 'duration')} className="border rounded px-2 py-1">
                  <option value="price">{t('cheapest', 'Cheapest')}</option>
                  <option value="duration">{t('shortest', 'Shortest Duration')}</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <ArrowRightLeft className="h-4 w-4" />
                <select value={stopsFilter} onChange={e => setStopsFilter(e.target.value as 'all' | 'direct' | '1' | '2+')} className="border rounded px-2 py-1">
                  <option value="all">{t('allStops', 'All Stops')}</option>
                  <option value="direct">{t('direct', 'Direct')}</option>
                  <option value="1">1 {t('stop', 'Stop')}</option>
                  <option value="2+">2+ {t('stops', 'Stops')}</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <Sun className="h-4 w-4" />
                <select value={timeOfDayFilter} onChange={e => setTimeOfDayFilter(e.target.value as 'all' | 'morning' | 'afternoon' | 'evening' | 'night')} className="border rounded px-2 py-1">
                  <option value="all">{t('allTimes', 'All Times')}</option>
                  <option value="morning">{t('morning', 'Morning')}</option>
                  <option value="afternoon">{t('afternoon', 'Afternoon')}</option>
                  <option value="evening">{t('evening', 'Evening')}</option>
                  <option value="night">{t('night', 'Night')}</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs">{t('airline', 'Airline')}</span>
                <select value={airlineFilter} onChange={e => setAirlineFilter(e.target.value)} className="border rounded px-2 py-1">
                  <option value="all">{t('allAirlines', 'All Airlines')}</option>
                  {[...new Set(Object.values(flights).map(f => f.airline_name || f.legs[0].segments[0].airline_name))].map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>
            {isPolling && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <PlaneAnimation size="sm" className="w-4 h-4" />
                <span>{t('searchingMoreFlights', 'Searching for more flights...')} {searchProgress}%</span>
              </div>
            )}
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center py-12 space-y-4">
              <PlaneAnimation size="lg" />
              <div className="text-center">
                <p className="text-lg font-medium text-gray-700">{t('searching', 'Searching for flights...')}</p>
                <p className="text-sm text-gray-500">{t('searchingProgress', 'Please wait while we find the best deals for you')}</p>
                {searchProgress > 0 && (
                  <div className="mt-2">
                    <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
                      <div 
                        className="bg-tourtastic-blue h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${searchProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{searchProgress}% complete</p>
                  </div>
                )}
              </div>
            </div>
          ) : filteredFlights.length > 0 ? (
            <FlightResults
              flights={filteredFlights}
              selectedFlight={selectedFlight}
              showDetails={showDetails}
              onFlightSelection={handleFlightSelection}
              onAddToCart={handleAddToCart}
              onShowDetails={(flightId) => setShowDetails(flightId)}
              showSegmentHeaders={true}
              groupedFlights={groupedFlights}
              visibleFlightsPerSegment={visibleFlightsPerSegment}
              onLoadMore={loadMoreFlights}
              initialFlightsPerSegment={INITIAL_FLIGHTS_PER_SEGMENT}
            />
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
