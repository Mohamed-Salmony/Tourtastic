import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

// Mock flight data
const mockFlights = [
  {
    id: 'FL001',
    airline: 'Tourtastic Airlines',
    logo: 'https://cdn-icons-png.flaticon.com/512/1701/1701211.png',
    flightNumber: 'TA1234',
    from: 'New York',
    to: 'Paris',
    departureDate: '2023-07-15',
    departureTime: '08:30',
    arrivalDate: '2023-07-15',
    arrivalTime: '20:15',
    duration: '7h 45m',
    stops: 0,
    price: 549,
  },
  {
    id: 'FL002',
    airline: 'SkyHigh Airways',
    logo: 'https://cdn-icons-png.flaticon.com/512/3125/3125713.png',
    flightNumber: 'SH5678',
    from: 'New York',
    to: 'Paris',
    departureDate: '2023-07-15',
    departureTime: '10:45',
    arrivalDate: '2023-07-15',
    arrivalTime: '23:00',
    duration: '8h 15m',
    stops: 1,
    stopCity: 'London',
    price: 499,
  },
  {
    id: 'FL003',
    airline: 'Global Connect',
    logo: 'https://cdn-icons-png.flaticon.com/512/1086/1086215.png',
    flightNumber: 'GC7890',
    from: 'New York',
    to: 'Paris',
    departureDate: '2023-07-15',
    departureTime: '14:20',
    arrivalDate: '2023-07-16',
    arrivalTime: '02:10',
    duration: '7h 50m',
    stops: 0,
    price: 589,
  },
  {
    id: 'FL004',
    airline: 'Air Velocity',
    logo: 'https://cdn-icons-png.flaticon.com/512/3125/3125819.png',
    flightNumber: 'AV2345',
    from: 'New York',
    to: 'Paris',
    departureDate: '2023-07-15',
    departureTime: '16:30',
    arrivalDate: '2023-07-16',
    arrivalTime: '05:15',
    duration: '8h 45m',
    stops: 1,
    stopCity: 'Amsterdam',
    price: 475,
  },
];

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
  const [hasSearched, setHasSearched] = useState(false);
  const [flights, setFlights] = useState<typeof mockFlights>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, control, setValue, watch } = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      from: '',
      to: '',
      passengers: '1',
    },
  });

  const departureDate = watch('departureDate');
  const returnDate = watch('returnDate');

  const onSubmit = async (data: SearchFormValues) => {
    setIsLoading(true);
    console.log('Search form data:', data);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setFlights(mockFlights);
    setHasSearched(true);
    setIsLoading(false);
  };

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

              {/* Search Button (full width on mobile, normal on desktop) */}
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
            <p className="text-lg font-medium">{t('searchingForBestFlights', 'Searching for the best flights...')}</p>
          </div>
        ) : hasSearched ? (
          <>
            <h2 className="text-2xl font-bold mb-6">{t('flightResults', 'Flight Results')}</h2>
            <div className="space-y-4">
              {flights.map((flight) => (
                <Card key={flight.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-6">
                      {/* Airline */}
                      <div className="flex items-center">
                        <img 
                          src={flight.logo} 
                          alt={flight.airline} 
                          className="h-10 w-10 mr-3" 
                        />
                        <div>
                          <p className="font-bold">{flight.airline}</p>
                          <p className="text-sm text-gray-500">{flight.flightNumber}</p>
                        </div>
                      </div>

                      {/* Departure/Arrival */}
                      <div className="col-span-2 flex flex-col justify-center">
                        <div className="flex justify-between items-center">
                          <div className="text-center">
                            <p className="font-bold text-lg">{flight.departureTime}</p>
                            <p className="text-sm text-gray-500">{flight.from}</p>
                          </div>
                          
                          <div className="flex-1 mx-4 relative">
                            <div className="border-t border-gray-300 my-3"></div>
                            <div className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 bg-white px-2 text-xs text-gray-500">
                              {flight.duration}
                            </div>
                            {flight.stops > 0 && (
                              <div className="absolute bottom-0 left-1/2 transform translate-x(-50%) text-xs text-gray-500">
                                {flight.stops} stop ({flight.stopCity})
                              </div>
                            )}
                          </div>
                          
                          <div className="text-center">
                            <p className="font-bold text-lg">{flight.arrivalTime}</p>
                            <p className="text-sm text-gray-500">{flight.to}</p>
                          </div>
                        </div>
                        <div className="mt-2 text-center text-sm text-gray-500">
                          {flight.stops === 0 ? t('directFlight', 'Direct Flight') : `${flight.stops} ${t('stop', 'Stop')}`}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex flex-col justify-center items-center">
                        <p className="font-bold text-lg text-tourtastic-blue">${flight.price}</p>
                        <p className="text-sm text-gray-500">{t('perPerson', 'per person')}</p>
                      </div>

                      {/* Select Button */}
                      <div className="flex items-center justify-center">
                        <Button>{t('select', 'Select')}</Button>
                      </div>
                    </div>
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
