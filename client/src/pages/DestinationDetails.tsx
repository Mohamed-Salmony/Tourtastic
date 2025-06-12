import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Star, Calendar, Plane, Clock, Users, MapPin, Landmark, Utensils, ShoppingBag, Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Destination, getAllDestinations } from '@/services/destinationService';
import { Flight, searchFlights, getSearchResults } from '@/services/flightService';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from '@/lib/utils';
import { api } from '@/config/api';

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
  const [userLocation, setUserLocation] = useState<string | null>(null);

  // Get user's location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // In a real application, you would use a geocoding service to convert coordinates to nearest airport
            // For now, we'll use a mock airport based on the coordinates
            const { latitude, longitude } = position.coords;
            // Simple logic to determine nearest major airport (mock implementation)
            let nearestAirport = 'JFK'; // Default to JFK
            if (latitude > 40 && longitude < -70) nearestAirport = 'BOS';
            if (latitude < 40 && longitude < -80) nearestAirport = 'MIA';
            if (latitude > 40 && longitude > -80) nearestAirport = 'ORD';
            if (latitude < 40 && longitude > -80) nearestAirport = 'LAX';
            setUserLocation(nearestAirport);
          } catch (error) {
            console.error('Error getting location:', error);
            setUserLocation('JFK'); // Fallback to JFK
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setUserLocation('JFK'); // Fallback to JFK
        }
      );
    } else {
      setUserLocation('JFK'); // Fallback to JFK
    }
  }, []);

  const pollSearchResults = useCallback(async (searchId: string, maxAttempts = 5) => {
    setIsPolling(true);
    let attempts = 0;
    
    const poll = async () => {
      try {
        const results = await getSearchResults(searchId);
        if (results.success && results.data.flights.length > 0) {
          setFlights(results.data.flights);
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
  }, [t, toast]);

  // Fetch destination details and search for flights
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

  // Separate useEffect for flight search
  useEffect(() => {
    if (userLocation && destination) {
      searchFlightsForDestination();
    }
  }, [userLocation, destination]);

  const searchFlightsForDestination = async () => {
    if (!destinationId || !userLocation || !destination) return;
    
    setIsLoading(true);
    try {
      // Format date as YYYY-MM-DD for today
      const today = new Date();
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(today.getDate() + 30);
      
      const formattedStartDate = today.toISOString().split('T')[0];
      const formattedEndDate = thirtyDaysLater.toISOString().split('T')[0];

      const searchParams = {
        from: userLocation,
        to: destination.airportCode || destination.quickInfo.airport,
        departureDate: formattedStartDate,
        returnDate: formattedEndDate,
        adults: 1,
        children: 0,
        infants: 0,
      };

      console.log('Search params:', searchParams); // Debug log

      const response = await searchFlights(searchParams);
      
      if (response.success && response.data.searchId) {
        await pollSearchResults(response.data.searchId);
      } else {
        throw new Error(response.message || 'Search initialization failed');
      }
    } catch (error) {
      console.error('Search error:', error); // Debug log
      setIsLoading(false);
      toast({
        title: t('error', 'Error'),
        description: t('flightSearchError', 'Failed to search for flights. Please try again.'),
        variant: 'destructive',
      });
    }
  };

  // Filter and sort flights
  const filteredAndSortedFlights = flights
    .filter(flight => selectedClass === 'all' || flight.class.toLowerCase() === selectedClass.toLowerCase())
    .sort((a, b) => {
      if (sortBy === 'price') {
        return a.price.total - b.price.total;
      } else if (sortBy === 'duration') {
        return a.duration.localeCompare(b.duration);
      } else if (sortBy === 'departure') {
        return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
      }
      return 0;
    });

  if (loadingDestination) {
    return (
      <Layout>
        <section className="py-16 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading destination details...</p>
        </section>
      </Layout>
    );
  }

  if (errorDestination || !destination) {
    return (
      <Layout>
        <section className="py-16 text-center">
          <p className="text-lg text-red-500">{errorDestination || 'Destination not found'}</p>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
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
                        {destination.name === 'Paris' && 'Eiffel Tower, Louvre Museum, Notre-Dame'}
                        {destination.name === 'Santorini' && 'Oia Village, Red Beach, Ancient Thera'}
                        {destination.name === 'Bali' && 'Ubud Monkey Forest, Tegallalang Rice Terraces, Uluwatu Temple'}
                        {destination.name === 'Tokyo' && 'Tokyo Skytree, Senso-ji Temple, Shibuya Crossing'}
                        {destination.name === 'New York' && 'Statue of Liberty, Central Park, Empire State Building'}
                        {destination.name === 'Rome' && 'Colosseum, Vatican City, Trevi Fountain'}
                        {destination.name === 'Sydney' && 'Sydney Opera House, Bondi Beach, Harbour Bridge'}
                        {destination.name === 'Barcelona' && 'Sagrada Familia, Park Güell, La Rambla'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Utensils className="w-5 h-5 text-primary-500 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">{t('localCuisine', 'Local Cuisine')}</h3>
                      <p className="text-gray-600 text-sm">
                        {destination.name === 'Paris' && 'Croissants, Coq au Vin, French Wine'}
                        {destination.name === 'Santorini' && 'Fresh Seafood, Fava, Local Wine'}
                        {destination.name === 'Bali' && 'Nasi Goreng, Satay, Fresh Tropical Fruits'}
                        {destination.name === 'Tokyo' && 'Sushi, Ramen, Tempura'}
                        {destination.name === 'New York' && 'Pizza, Bagels, Street Food'}
                        {destination.name === 'Rome' && 'Pasta, Pizza, Gelato'}
                        {destination.name === 'Sydney' && 'Seafood, Meat Pies, Tim Tams'}
                        {destination.name === 'Barcelona' && 'Tapas, Paella, Churros'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <ShoppingBag className="w-5 h-5 text-primary-500 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">{t('shopping', 'Shopping')}</h3>
                      <p className="text-gray-600 text-sm">
                        {destination.name === 'Paris' && 'Champs-Élysées, Le Marais, Galeries Lafayette'}
                        {destination.name === 'Santorini' && 'Local Art, Jewelry, Wine Shops'}
                        {destination.name === 'Bali' && 'Ubud Market, Seminyak, Local Crafts'}
                        {destination.name === 'Tokyo' && 'Shibuya, Ginza, Akihabara'}
                        {destination.name === 'New York' && 'Fifth Avenue, SoHo, Times Square'}
                        {destination.name === 'Rome' && 'Via del Corso, Via Condotti, Local Markets'}
                        {destination.name === 'Sydney' && 'Queen Victoria Building, The Rocks, Pitt Street Mall'}
                        {destination.name === 'Barcelona' && 'La Rambla, Passeig de Gràcia, Local Markets'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Camera className="w-5 h-5 text-primary-500 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">{t('bestTimeToVisit', 'Best Time to Visit')}</h3>
                      <p className="text-gray-600 text-sm">
                        {destination.name === 'Paris' && 'April to June, September to October'}
                        {destination.name === 'Santorini' && 'Late April to Early October'}
                        {destination.name === 'Bali' && 'April to October'}
                        {destination.name === 'Tokyo' && 'March to May, September to November'}
                        {destination.name === 'New York' && 'April to June, September to November'}
                        {destination.name === 'Rome' && 'April to June, September to October'}
                        {destination.name === 'Sydney' && 'September to November, March to May'}
                        {destination.name === 'Barcelona' && 'May to June, September to October'}
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
                      <p className="font-medium">{destination.airportCode}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary-500" />
                    <div>
                      <p className="text-sm text-gray-500">{t('timeZone', 'Time Zone')}</p>
                      <p className="font-medium">
                        {destination.name === 'Paris' && 'CET (UTC+1)'}
                        {destination.name === 'Santorini' && 'EET (UTC+2)'}
                        {destination.name === 'Bali' && 'WITA (UTC+8)'}
                        {destination.name === 'Tokyo' && 'JST (UTC+9)'}
                        {destination.name === 'New York' && 'EST (UTC-5)'}
                        {destination.name === 'Rome' && 'CET (UTC+1)'}
                        {destination.name === 'Sydney' && 'AEST (UTC+10)'}
                        {destination.name === 'Barcelona' && 'CET (UTC+1)'}
                      </p>
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

      {/* Filters Section */}
      <section className="py-8 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                  <SelectItem value="departure">Departure Time</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="economy">Economy</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="first">First Class</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Flights Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">{t('availableTickets', 'Available Tickets')}</h2>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              <p className="ml-2 text-gray-600">
                {isPolling 
                  ? t('processingResults', 'Processing your search results...')
                  : t('searchingForBestFlights', 'Searching for the best flights...')}
              </p>
            </div>
          ) : filteredAndSortedFlights.length === 0 ? (
            <p className="text-center text-gray-500">No tickets available for this destination.</p>
          ) : (
            <div className="space-y-6">
              {filteredAndSortedFlights.map((flight) => (
                <div key={flight.flightId} className="space-y-4">
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6">
                      {/* Airline Info */}
                      <div className="md:col-span-3 flex flex-col items-center md:items-start">
                        <h3 className="text-xl font-semibold mb-2">{flight.airline}</h3>
                        <div className="flex items-center text-gray-500">
                          <Plane className="w-4 h-4 mr-1" />
                          <span>{flight.class}</span>
                        </div>
                      </div>

                      {/* Flight Details */}
                      <div className="md:col-span-6 flex flex-col items-center">
                        <div className="flex items-center justify-between w-full mb-4">
                          <div className="text-center">
                            <p className="text-lg font-semibold">{flight.departureAirport}</p>
                            <p className="text-sm text-gray-500">{format(new Date(flight.departureTime), 'HH:mm')}</p>
                            <p className="text-xs text-gray-400">{format(new Date(flight.departureTime), 'MMM d, yyyy')}</p>
                          </div>
                          <div className="flex-1 mx-4">
                            <div className="relative">
                              <div className="h-0.5 bg-gray-300"></div>
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <Plane className="w-4 h-4 text-primary-500" />
                              </div>
                            </div>
                            <div className="flex items-center justify-center gap-2 mt-1">
                              <Clock className="w-3 h-3 text-gray-500" />
                              <p className="text-sm text-gray-500">{flight.duration}</p>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold">{flight.arrivalAirport}</p>
                            <p className="text-sm text-gray-500">{format(new Date(flight.arrivalTime), 'HH:mm')}</p>
                            <p className="text-xs text-gray-400">{format(new Date(flight.arrivalTime), 'MMM d, yyyy')}</p>
                          </div>
                        </div>
                        {flight.layovers.length > 0 && (
                          <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                            <Plane className="w-3 h-3" />
                            <span>{flight.layovers.length} {t('stop', 'Stop')} ({flight.layovers.map(l => l.airport).join(', ')})</span>
                          </div>
                        )}
                      </div>

                      {/* Price and Action */}
                      <div className="md:col-span-3 flex flex-col items-center justify-center gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-primary-600">${flight.price.total}</p>
                          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                            <Users className="w-3 h-3" />
                            <span>{flight.availableSeats} {t('seatsLeft', 'seats left')}</span>
                          </div>
                        </div>
                        <Button 
                          variant={selectedFlight?.flightId === flight.flightId ? "secondary" : "default"}
                          onClick={() => setSelectedFlight(selectedFlight?.flightId === flight.flightId ? null : flight)}
                          className="w-full"
                          disabled={flight.availableSeats === 0}
                        >
                          {selectedFlight?.flightId === flight.flightId ? t('selected', 'Selected') : t('select', 'Select')}
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Booking Details Section */}
                  {selectedFlight?.flightId === flight.flightId && (
                    <Card className="bg-gray-50">
                      <div className="p-6">
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
                            <Button 
                              className="mt-4 w-full" 
                              onClick={async () => {
                                try {
                                  const bookingData = {
                                    flightDetails: {
                                      from: userLocation,
                                      to: destination.airportCode,
                                      departureDate: new Date(flight.departureTime),
                                      passengers: {
                                        adults: 1,
                                        children: 0,
                                        infants: 0
                                      },
                                      selectedFlight: {
                                        ...flight,
                                        price: {
                                          total: flight.price.total,
                                          currency: 'USD'
                                        }
                                      }
                                    }
                                  };
                                  
                                  const response = await api.post('/flights/book', bookingData);
                                  
                                  if (response.data.success) {
                                    toast({
                                      title: t('success', 'Success'),
                                      description: t('flightAddedToCart', 'Flight added to cart successfully!'),
                                      variant: 'default',
                                    });
                                    navigate('/cart');
                                  } else {
                                    throw new Error(response.data.message || 'Failed to create booking');
                                  }
                                } catch (error) {
                                  console.error('Error creating booking:', error);
                                  toast({
                                    title: t('error', 'Error'),
                                    description: t('bookingError', 'Failed to add flight to cart. Please try again.'),
                                    variant: 'destructive',
                                  });
                                }
                              }}>
                              {t('continueToBooking', 'Continue to Booking')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default DestinationDetails; 