import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flight, PassengerCount } from '@/services/flightService';
import { toast } from '@/hooks/use-toast';
import api from '@/config/api';
import { MultiCityFlightResults } from '@/components/flights/MultiCityFlightResults';
import { useMultiCitySearch } from '@/hooks/useMultiCitySearch';

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
  const [selectedFlights, setSelectedFlights] = useState<Record<number, Flight>>({});
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [fromAirportNames, setFromAirportNames] = useState<string[]>(['']);
  const [toAirportNames, setToAirportNames] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initializedFromStateRef = useRef(false);

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

  const { searchSections, startMultiSearch, loadMore } = useMultiCitySearch();

  const onSubmit = useCallback(async (data: SearchFormValues) => {
    try {
      setIsSubmitting(true);
      const segmentsForHook = data.flightSegments.map((segment, idx) => ({
        from: segment.from,
        to: segment.to,
        date: segment.date,
        fromDisplay: fromAirportNames[idx] || segment.from,
        toDisplay: toAirportNames[idx] || segment.to,
      }));

      await startMultiSearch(segmentsForHook, {
        adults: data.passengers.adults ?? 1,
        children: data.passengers.children ?? 0,
        infants: data.passengers.infants ?? 0,
      }, data.cabin, data.direct);

      setHasSearched(true);
    } catch (error) {
      toast({
        title: t('error', 'Error'),
        description: t('flightSearchError', 'Failed to search for flights. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [fromAirportNames, toAirportNames, startMultiSearch, t]);

  // Define type for segments from home page state
  interface LocationStateSegment {
    from: string;
    to: string;
    date: string | Date;
    fromDisplayValue?: string;
    toDisplayValue?: string;
  }

  // Handle search params from home page (initialize once)
  useEffect(() => {
    if (initializedFromStateRef.current) return;
    if (!location.state) return;

    const { flightSegments: segments, passengers: passengerCounts } = location.state as {
      flightSegments?: Array<LocationStateSegment>;
      passengers?: PassengerCount;
      cabin?: 'e' | 'p' | 'b' | 'f';
      direct?: boolean;
    };

    if (segments && segments.length > 0) {
      const fromNames = segments.map(seg => seg.fromDisplayValue || seg.from);
      const toNames = segments.map(seg => seg.toDisplayValue || seg.to);
      setFromAirportNames(fromNames);
      setToAirportNames(toNames);

      setValue('flightSegments', segments.map((segment: LocationStateSegment) => ({
        from: segment.from,
        to: segment.to,
        date: new Date(segment.date),
      })));
    }

    if (passengerCounts) {
      setValue('passengers', passengerCounts);
    }

    // Auto submit once when fully provided
    if (segments && segments.length > 0 && segments.every((segment: LocationStateSegment) => segment.from && segment.to && segment.date)) {
      onSubmit({
        flightSegments: segments.map((segment: LocationStateSegment) => ({
          from: segment.from,
          to: segment.to,
          date: new Date(segment.date),
        })),
        passengers: passengerCounts || { adults: 1, children: 0, infants: 0 },
        cabin: 'e',
        direct: false,
      });
    }

    initializedFromStateRef.current = true;
  }, [location.state, onSubmit, setValue]);

  const handleFlightSelection = useCallback((flight: Flight, searchIndex: number) => {
    setSelectedFlights(prev => ({ ...prev, [searchIndex]: flight }));
    setShowDetails(flight.trip_id);
  }, []);

  const handleAddToCart = useCallback(async (flight: Flight) => {
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
  }, [navigate, t]);

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
                          placeholder={t('departureCity', 'Departure city')}
                          value={fromAirportNames[index] || segment.from || ''}
                          {...register(`flightSegments.${index}.from`)}
                          onChange={(e) => {
                            const value = e.target.value;
                            const newNames = [...fromAirportNames];
                            newNames[index] = value;
                            setFromAirportNames(newNames);
                            const iataMatch = value.match(/^([A-Z]{3})\s-/);
                            if (iataMatch) {
                              setValue(`flightSegments.${index}.from`, iataMatch[1]);
                            } else {
                              setValue(`flightSegments.${index}.from`, value);
                            }
                          }}
                          className="pr-10"
                        />
                        {fromAirportNames[index] && fromAirportNames[index].includes(' - ') && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <span className="text-xs text-green-600">✓</span>
                          </div>
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
                          placeholder={t('destinationCity', 'Destination city')}
                          value={toAirportNames[index] || segment.to || ''}
                          {...register(`flightSegments.${index}.to`)}
                          onChange={(e) => {
                            const value = e.target.value;
                            const newNames = [...toAirportNames];
                            newNames[index] = value;
                            setToAirportNames(newNames);
                            const iataMatch = value.match(/^([A-Z]{3})\s-/);
                            if (iataMatch) {
                              setValue(`flightSegments.${index}.to`, iataMatch[1]);
                            } else {
                              setValue(`flightSegments.${index}.to`, value);
                            }
                          }}
                          className="pr-10"
                        />
                        {toAirportNames[index] && toAirportNames[index].includes(' - ') && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <span className="text-xs text-green-600">✓</span>
                          </div>
                        )}
                      </div>
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
                              'w-full justify-start text-left font-normal',
                              !segment.date && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {segment.date ? (segment.date instanceof Date && !isNaN(segment.date.getTime()) ? format(segment.date, 'PPP') : <span>{t('pickDate', 'Pick a date')}</span>) : <span>{t('pickDate', 'Pick a date')}</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={segment.date}
                            onSelect={(date) => date && setValue(`flightSegments.${index}.date`, date)}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className={cn('p-3 pointer-events-auto')}
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
                      variant={direct ? 'default' : 'outline'}
                      onClick={() => setValue('direct', true)}
                    >
                      {t('directOnly', 'Direct Only')}
                    </Button>
                    <Button
                      type="button"
                      variant={!direct ? 'default' : 'outline'}
                      onClick={() => setValue('direct', false)}
                    >
                      {t('allFlights', 'All Flights')}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Search Button */}
              <Button type="submit" disabled={isSubmitting} className="w-full bg-tourtastic-blue hover:bg-tourtastic-dark-blue text-white">
                {isSubmitting ? (
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
          <MultiCityFlightResults
            searchSections={searchSections}
            passengers={{ adults: passengers.adults, children: passengers.children, infants: passengers.infants }}
            onFlightSelection={handleFlightSelection}
            onLoadMore={loadMore}
            onAddToCart={handleAddToCart}
            selectedFlights={selectedFlights}
            showDetails={showDetails}
          />
        </div>
      )}
    </>
  );
};

export default Flights;
