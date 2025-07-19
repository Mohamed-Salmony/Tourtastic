import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { 
  Star, 
  MapPin, 
  Clock, 
  Plane, 
  Landmark, 
  Utensils, 
  ShoppingBag, 
  Camera,
  Sunrise,
  Sun,
  Sunset,
  Moon
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import  PlaneAnimation  from '../components/ui/PlaneAnimation';
import api from '../config/api';
import { Destination } from '../services/destinationService';
import { Flight, FlightSearchParams, searchFlights, getSearchResults } from '../services/flightService';
import { Airport, findCapitalAirport } from '../services/airportService';
import FlightResults from '@/components/flights/FlightResults';

// Helper functions
const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${remainingMinutes}m`;
  }
};

const getTimeOfDay = (dateString: string) => {
  const hour = new Date(dateString).getHours();
  if (hour < 6) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

const getTimeOfDayIcon = (timeOfDay: string) => {
  switch (timeOfDay) {
    case 'morning': return <Sunrise className="w-4 h-4 text-orange-400" />;
    case 'afternoon': return <Sun className="w-4 h-4 text-yellow-400" />;
    case 'evening': return <Sunset className="w-4 h-4 text-orange-600" />;
    default: return <Moon className="w-4 h-4 text-blue-400" />;
  }
};

const getAirlineLogo = (airlineName: string): string => {
  const logoMap: Record<string, string> = {
    'EgyptAir': '/egyptair-logo.png',
    'Emirates': '/Emirates-Logo.png',
    'Turkish Airlines': '/Turkish-Airlines-Logo.png',
    'Qatar Airways': '/Qatar Airways Logo.png',
    'Saudi Arabian Airlines': '/Saudi-Arabian-Airlines-Logo.png',
    'Kuwait Airways': '/Kuwait-Airways-logo.png',
    'Oman Air': '/Oman-Air-Logo.png',
    'Etihad Airways': '/Etihad-Airways-Logo.png',
    'FlyDubai': '/FlyDubai-Logo.png',
    'Air Algerie': '/Air-Algerie-Logo.png',
    'Tunisair': '/Tunisair-logo.png',
    'Royal Jordanian': '/Royal-Jordanian-logo.png',
    'Middle East Airlines': '/Middle-East-Airlines-Logo.png',
    'Nile Air': '/Nile-air-logo.png',
    'Flynas': '/Flynas-Logo.png',
    'Gulf Air': '/Gulf-Air-logo.png',
    'Pegasus Airlines': '/Pegasus-Airlines-Logo.png',
    'AJet': '/AJet-logo.png',
    'Aegean Airlines': '/Aegean-Airlines-logo.png',
    'Air India': '/Air-India-Logo.png',
    'Ethiopian Airlines': '/Ethiopian-Airlines-Logo.png',
    'Hahn Air': '/Hahn-Air-Logo.png',
    'Nemsa Airlines': '/Nemsa-Airlines-Logo.png',
    'Pakistan International Airlines': '/Pakistan-International-Airlines-Logo.png'
  };
  return logoMap[airlineName] || '/Tourtastic-logo.png';
};

const DestinationDetails: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { destinationId } = useParams<{ destinationId: string }>();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [loadingDestination, setLoadingDestination] = useState(true);
  const [errorDestination, setErrorDestination] = useState<string | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [sortBy, setSortBy] = useState('price');
  const [selectedClass, setSelectedClass] = useState('all');
  const [nearestAirport, setNearestAirport] = useState<Airport | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [manualOrigin, setManualOrigin] = useState('');

  // Handler for flight selection
  const handleFlightSelection = (flight: Flight) => {
    setSelectedFlight(flight);
    setShowDetails(showDetails === flight.trip_id ? null : flight.trip_id);
  };

  // Handler for adding flight to cart
  const handleAddToCart = async (flight: Flight) => {
    try {
      const response = await api.post('/cart/add', {
        type: 'flight',
        flightData: flight,
        destinationId: destinationId
      });
      
      if (response.data.success) {
        toast({
          title: t('success', 'Success'),
          description: t('flightAddedToCart', 'Flight has been added to your cart'),
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Error adding flight to cart:', error);
      toast({
        title: t('error', 'Error'),
        description: t('failedToAddToCart', 'Failed to add flight to cart'),
        variant: 'destructive',
      });
    }
  };

  // Get user's location and find nearest airport
  useEffect(() => {
    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              console.log('User location:', { latitude, longitude });
              
              // Use capital airport instead of nearest airport
              const airport = await findCapitalAirport(latitude, longitude);
              console.log('Found capital airport:', airport);
              setNearestAirport(airport);
              setLocationError(null);
            } catch (error) {
              console.error('Error finding capital airport:', error);
              setLocationError('Failed to find capital airport. Please enable location services or enter manually.');
            }
          },
          (error) => {
            console.error('Geolocation error:', error);
            setLocationError('Unable to get your location. Please enable location services or enter your departure city manually.');
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      } else {
        setLocationError('Geolocation is not supported by this browser. Please enter manually.');
      }
    };

    getUserLocation();
  }, []);

  const pollSearchResults = useCallback(async (searchId: string, maxAttempts = 10) => {
    setIsPolling(true);
    let attempts = 0;
    
    const poll = async () => {
      try {
        const results = await getSearchResults(searchId);
        console.log('Poll results:', results);
        
        if (results.complete === 100 && results.result && results.result.length > 0) {
          console.log('Found flights:', JSON.stringify(results.result, null, 2));
          setFlights(results.result);
          setIsPolling(false);
          setIsLoading(false);
        } else if (attempts < maxAttempts) {
          attempts++;
          console.log(`Poll attempt ${attempts} of ${maxAttempts}`);
          setTimeout(poll, 3000);
        } else {
          setIsPolling(false);
          setIsLoading(false);
          toast({
            title: t('noFlights', 'No Flights Found'),
            description: t('noFlightsAvailable', 'No flights are currently available for this destination. Please try different dates or check back later.'),
            variant: 'default',
          });
        }
      } catch (error) {
        console.error('Poll error:', error);
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
  }, [t, toast]);

  // Fetch destination details
  useEffect(() => {
    const fetchDestinationDetails = async () => {
      if (!destinationId) return;
      setLoadingDestination(true);
      setErrorDestination(null);
      try {
        const response = await api.get(`/destinations/${destinationId}`);
        if (response.data.success) {
          setDestination(response.data.data);
        } else {
          setErrorDestination('Destination not found.');
        }
      } catch (error) {
        console.error('Error fetching destination details:', error);
        setErrorDestination('Failed to load destination details.');
      } finally {
        setLoadingDestination(false);
      }
    };

    fetchDestinationDetails();
  }, [destinationId]);

  const searchFlightsForDestination = useCallback(async () => {
    if (!destinationId || !nearestAirport || !destination) return;
    
    // Validate airport codes - use destination.quickInfo.airport instead of destination.airportCode
    if (!nearestAirport.code || nearestAirport.code.length !== 3 || !destination.quickInfo.airport || destination.quickInfo.airport.length !== 3) {
      console.error('Invalid airport codes:', { origin: nearestAirport.code, destination: destination.quickInfo.airport });
      toast({
        title: 'Error',
        description: 'Invalid airport codes. Please try again later.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const today = new Date();
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const formattedStartDate = today.toISOString().split('T')[0];
      const formattedEndDate = lastDayOfMonth.toISOString().split('T')[0];
  
      console.log('Nearest airport:', nearestAirport);
      console.log('Destination airport code:', destination.quickInfo.airport);
      console.log('Destination object:', destination);
  
      const searchParams: FlightSearchParams = {
        flightSegments: [
          {
            from: nearestAirport.code,
            to: destination.quickInfo.airport,
            date: formattedStartDate
          },
          {
            from: destination.quickInfo.airport,
            to: nearestAirport.code,
            date: formattedEndDate
          }
        ],
        passengers: {
          adults: 1,
          children: 0,
          infants: 0
        },
        cabin: 'e'
      };

      console.log('Search params:', searchParams);
      const searchResponse = await searchFlights(searchParams);
      console.log('Search response:', searchResponse);
      
      if (searchResponse.search_id) {
        await pollSearchResults(searchResponse.search_id);
      } else {
        setIsLoading(false);
        toast({
          title: t('error', 'Error'),
          description: t('flightSearchError', 'Failed to initiate flight search. Please try again.'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error searching flights:', error);
      setIsLoading(false);
      toast({
        title: t('error', 'Error'),
        description: t('flightSearchError', 'Failed to search for flights. Please try again.'),
        variant: 'destructive',
      });
    }
  }, [destinationId, nearestAirport, destination, toast, pollSearchResults, t]);

  // Search for flights when airport and destination are available
  useEffect(() => {
    if (nearestAirport && destination && !isLoading && flights.length === 0) {
      searchFlightsForDestination();
    }
  }, [nearestAirport, destination, searchFlightsForDestination, isLoading, flights.length]);

  // Filter and sort flights
  const filteredAndSortedFlights = flights
    .filter(flight => {
      if (selectedClass === 'all') return true;
      return flight.legs[0]?.cabin?.toLowerCase() === selectedClass;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return (a.price || 0) - (b.price || 0);
        case 'duration':
          return (a.total_duration || 0) - (b.total_duration || 0);
        case 'departure':
          return new Date(a.legs[0]?.from?.date || 0).getTime() - new Date(b.legs[0]?.from?.date || 0).getTime();
        default:
          return 0;
      }
    });

  if (loadingDestination) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PlaneAnimation size="lg" />
      </div>
    );
  }

  if (errorDestination || !destination) {
    return (
      <section className="py-16 text-center">
        <p className="text-lg text-red-500">{errorDestination || 'Destination not found'}</p>
      </section>
    );
  }

  return (
    <div>
      {locationError && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{locationError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative h-[400px] bg-cover bg-center" style={{ backgroundImage: `url(${destination.image})` }}>
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-end pb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{destination.name}</h1>
          <div className="flex items-center gap-4 text-white">
            <div className="flex items-center">
              <Star className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" />
              <span>{destination.rating.toFixed(1)}</span>
            </div>
            <span>•</span>
            <span>{destination.country}</span>
          </div>
        </div>
      </section>

      {/* Description Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Main Description */}
              <div className="md:col-span-2">
                <h2 className="text-3xl font-bold mb-6">{t('discover', 'Discover')} {destination.name}</h2>
                <p className="text-gray-600 leading-relaxed text-lg mb-6">{destination.description}</p>
                
                {/* Key Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                  <div className="flex items-start gap-3">
                    <Landmark className="w-5 h-5 text-primary-500 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">{t('topAttractions', 'Top Attractions')}</h3>
                      <p className="text-gray-600 text-sm">
                        {destination.topAttractions.join(', ')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Utensils className="w-5 h-5 text-primary-500 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">{t('localCuisine', 'Local Cuisine')}</h3>
                      <p className="text-gray-600 text-sm">
                        {destination.localCuisine.join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <ShoppingBag className="w-5 h-5 text-primary-500 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">{t('shopping', 'Shopping')}</h3>
                      <p className="text-gray-600 text-sm">
                        {destination.shopping.join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Camera className="w-5 h-5 text-primary-500 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">{t('bestTimeToVisit', 'Best Time to Visit')}</h3>
                      <p className="text-gray-600 text-sm">
                        {destination.bestTimeToVisit}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Info Sidebar */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">{t('quickInfo', 'Quick Info')}</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary-500" />
                    <div>
                      <p className="text-sm text-gray-500">{t('airport', 'Airport')}</p>
                      <p className="font-medium">{destination.quickInfo.airport}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary-500" />
                    <div>
                      <p className="text-sm text-gray-500">{t('timeZone', 'Time Zone')}</p>
                      <p className="font-medium">{destination.quickInfo.timeZone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-primary-500" />
                    <div>
                      <p className="text-sm text-gray-500">{t('rating', 'Rating')}</p>
                      <p className="font-medium">{destination.rating.toFixed(1)}/5.0</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Flights Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">
              {t('availableFlights', 'Available Flights')} {nearestAirport && `from ${nearestAirport.city}`}
            </h2>

            {/* Filters Section */}
            <div className="flex flex-wrap gap-4 items-center justify-between mb-8 p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">{t('sortBy', 'Sort by')}:</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price">{t('price', 'Price')}</SelectItem>
                      <SelectItem value="duration">{t('duration', 'Duration')}</SelectItem>
                      <SelectItem value="departure">{t('departure', 'Departure')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">{t('class', 'Class')}:</label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('all', 'All')}</SelectItem>
                      <SelectItem value="economy">{t('economy', 'Economy')}</SelectItem>
                      <SelectItem value="business">{t('business', 'Business')}</SelectItem>
                      <SelectItem value="first">{t('first', 'First')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                {filteredAndSortedFlights.length} {t('flightsFound', 'flights found')}
              </div>
            </div>

            {/* Loading State */}
            {(isLoading || isPolling) && (
              <div className="text-center py-12">
                <PlaneAnimation size="lg" />
                <p className="text-lg text-gray-600 mt-4">
                  {isPolling ? t('searchingFlights', 'Searching for flights...') : t('loading', 'Loading...')}
                </p>
              </div>
            )}

            {/* Flight Results */}
            {!isLoading && !isPolling && filteredAndSortedFlights.length > 0 && (
              <FlightResults
                flights={filteredAndSortedFlights}
                selectedFlight={selectedFlight}
                showDetails={showDetails}
                onFlightSelection={handleFlightSelection}
                onAddToCart={handleAddToCart}
                onShowDetails={(flightId: string) => setShowDetails(showDetails === flightId ? null : flightId)}
                showSegmentHeaders={false}
              />
            )}

            {/* No Flights Message */}
            {!isLoading && !isPolling && filteredAndSortedFlights.length === 0 && flights.length === 0 && (
              <div className="text-center py-12">
                <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">{t('noFlights', 'No Flights Found')}</h3>
                <p className="text-gray-500">{t('noFlightsMessage', 'No flights are currently available for this destination.')}</p>
                <Button
                  onClick={() => searchFlightsForDestination()}
                  className="mt-4"
                >
                  {t('searchAgain', 'Search Again')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default DestinationDetails;
