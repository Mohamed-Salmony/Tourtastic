import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { CalendarIcon, Sun, Moon, CloudSun, CloudMoon, ArrowRightLeft, Info, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Flight } from '@/services/flightService';

// Helper functions (extracted from Flights.tsx)
function getAirlineLogo(airlineName: string): string {
  const airlineLogos: Record<string, string> = {
    'EgyptAir': '/egyptair-logo.png',
    'Emirates': '/Emirates-Logo.png',
    'Turkish Airlines': '/Turkish-Airlines-Logo.png',
    'Qatar Airways': '/Qatar Airways Logo.png',
    'Saudi Arabian Airlines': '/Saudi-Arabian-Airlines-Logo.png',
    'Saudia': '/Saudi-Arabian-Airlines-Logo.png',
    'Kuwait Airways': '/Kuwait-Airways-logo.png',
    'Gulf Air': '/Gulf-Air-logo.png',
    'Royal Jordanian': '/Royal-Jordanian-logo.png',
    'Oman Air': '/Oman-Air-Logo.png',
    'Ethiopian Airlines': '/Ethiopian-Airlines-Logo.png',
    'Aegean Airlines': '/Aegean-Airlines-logo.png',
    'Flynas': '/Flynas-Logo.png',
    'Ajet': '/AJet-logo.png',
    'Middle East Airlines': '/Middle-East-Airlines-Logo.png',
    'Etihad Airways': '/Etihad-Airways-Logo.png',
    'Nile Air': '/Nile-air-logo.png',
    'Nemsa Airlines': '/Nemsa-Airlines-Logo.png',
    'Air Algerie': '/Air-Algerie-Logo.png',
    'Hahn Air': '/Hahn-Air-Logo.png',
    'Japan Airlines': '/Japan-Airlines-Logo.png',
    'FlyDubai': '/FlyDubai-Logo.png',
    'Pakistan International Airlines': '/Pakistan-International-Airlines-Logo.png',
    'Air India': '/Air-India-Logo.png',
    'Pegasus Airlines': '/Pegasus-Airlines-Logo.png',
    'ITA Airways': '/ITA-Airways-Logo.png',
    'SunExpress': '/SunExpress-Logo.png',
    'Kenya Airways': '/Kenya-Airways-Logo.png',
    'Sichuan Airlines': '/Sichuan-Airlines-Logo.png',
    'Malaysia Airlines': '/Malaysia-Airlines-Logo.png'
  };

  if (!airlineName) return '/Tourtastic-logo.png';
  
  // Direct match first
  if (airlineLogos[airlineName]) {
    return airlineLogos[airlineName];
  }
  
  // Normalize and check for partial matches
  const normalized = airlineName.trim().toLowerCase();
  
  // Specific airline mappings
  if (normalized.includes('egypt')) return '/egyptair-logo.png';
  if (normalized.includes('emirates')) return '/Emirates-Logo.png';
  if (normalized.includes('turkish')) return '/Turkish-Airlines-Logo.png';
  if (normalized.includes('qatar')) return '/Qatar Airways Logo.png';
  if (normalized.includes('saudi') || normalized.includes('saudia')) return '/Saudi-Arabian-Airlines-Logo.png';
  if (normalized.includes('kuwait')) return '/Kuwait-Airways-logo.png';
  if (normalized.includes('gulf air')) return '/Gulf-Air-logo.png';
  if (normalized.includes('royal jordanian')) return '/Royal-Jordanian-logo.png';
  if (normalized.includes('oman')) return '/Oman-Air-Logo.png';
  if (normalized.includes('ethiopian')) return '/Ethiopian-Airlines-Logo.png';
  if (normalized.includes('aegean')) return '/Aegean-Airlines-logo.png';
  if (normalized.includes('flynas')) return '/Flynas-Logo.png';
  if (normalized.includes('ajet') || normalized.includes('a jet')) return '/AJet-logo.png';
  if (normalized.includes('middle east')) return '/Middle-East-Airlines-Logo.png';
  if (normalized.includes('etihad')) return '/Etihad-Airways-Logo.png';
  if (normalized.includes('nile')) return '/Nile-air-logo.png';
  if (normalized.includes('nemsa')) return '/Nemsa-Airlines-Logo.png';
  if (normalized.includes('air algerie') || normalized.includes('algerie')) return '/Air-Algerie-Logo.png';
  if (normalized.includes('hahn')) return '/Hahn-Air-Logo.png';
  
  return '/Tourtastic-logo.png';
}

function getTimeOfDay(dateStr: string) {
  const hour = new Date(dateStr).getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function getTimeOfDayIcon(dateStr: string, size: string = 'h-3 w-3') {
  const hour = new Date(dateStr).getHours();
  
  if (hour >= 5 && hour < 12) {
    return <Sun className={`${size} text-yellow-500`} />;
  } else if (hour >= 12 && hour < 17) {
    return <CloudSun className={`${size} text-orange-500`} />;
  } else if (hour >= 17 && hour < 21) {
    return <CloudMoon className={`${size} text-purple-500`} />;
  } else {
    return <Moon className={`${size} text-blue-600`} />;
  }
}

function getTimeOfDayWithColor(dateStr: string) {
  const hour = new Date(dateStr).getHours();
  
  if (hour >= 5 && hour < 12) {
    return { period: 'morning', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
  } else if (hour >= 12 && hour < 17) {
    return { period: 'afternoon', color: 'text-orange-600', bgColor: 'bg-orange-50' };
  } else if (hour >= 17 && hour < 21) {
    return { period: 'evening', color: 'text-purple-600', bgColor: 'bg-purple-50' };
  } else {
    return { period: 'night', color: 'text-blue-600', bgColor: 'bg-blue-50' };
  }
}

interface FlightResultsProps {
  flights: Flight[];
  selectedFlight?: Flight | null;
  showDetails?: string | null;
  onFlightSelection: (flight: Flight) => void;
  onAddToCart?: (flight: Flight) => void;
  onShowDetails?: (flightId: string) => void;
  showSegmentHeaders?: boolean;
  groupedFlights?: Record<string, Flight[]>;
  visibleFlightsPerSegment?: Record<number, number>;
  onLoadMore?: (segmentIndex: number) => void;
  initialFlightsPerSegment?: number;
}

const FlightResults: React.FC<FlightResultsProps> = ({
  flights,
  selectedFlight,
  showDetails,
  onFlightSelection,
  onAddToCart,
  onShowDetails,
  showSegmentHeaders = false,
  groupedFlights,
  visibleFlightsPerSegment,
  onLoadMore,
  initialFlightsPerSegment = 3
}) => {
  const { t } = useTranslation();

  // If grouped flights are provided, use them; otherwise treat as single group
  const flightGroups = groupedFlights || { '0': flights };

  return (
    <div className="space-y-8">
      {Object.entries(flightGroups).map(([segmentIndex, segmentFlights]: [string, Flight[]]) => {
        const segmentNum = parseInt(segmentIndex);
        const visibleCount = visibleFlightsPerSegment?.[segmentNum] || initialFlightsPerSegment;
        const visibleFlights = segmentFlights.slice(0, visibleCount);
        const hasMoreFlights = segmentFlights.length > visibleCount;
        
        return (
          <div key={segmentIndex} className="space-y-4">
            {/* Segment Header */}
            {showSegmentHeaders && Object.keys(flightGroups).length > 1 && (
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-800">
                  {segmentFlights.length > 0 && segmentFlights[0].legs.length > 0 ? (
                    <>
                      {segmentFlights[0].legs[0].from.city || segmentFlights[0].legs[0].from.airport} 
                      <i className="fas fa-arrow-right mx-2"></i> 
                      {segmentFlights[0].legs[segmentFlights[0].legs.length - 1].to.city || segmentFlights[0].legs[segmentFlights[0].legs.length - 1].to.airport}
                    </>
                  ) : (
                    `${t('segment', 'Segment')} ${parseInt(segmentIndex) + 1}`
                  )}
                </h3>
                <p className="text-sm text-gray-600">
                  {segmentFlights.length} {t('flightsFound', 'flights found')}
                </p>
              </div>
            )}
            
            {/* Flight Cards for this segment */}
            <div className="space-y-4">
              {visibleFlights.map((flight, index) => (
                <FlightCard
                  key={`${flight.trip_id}-${index}`}
                  flight={flight}
                  selectedFlight={selectedFlight}
                  showDetails={showDetails}
                  onFlightSelection={onFlightSelection}
                  onAddToCart={onAddToCart}
                  onShowDetails={onShowDetails}
                />
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMoreFlights && onLoadMore && (
              <div className="flex justify-center mt-6">
                <Button
                  onClick={() => onLoadMore(segmentNum)}
                  variant="outline"
                  className="px-8 py-2 border-tourtastic-blue text-tourtastic-blue hover:bg-tourtastic-blue hover:text-white transition-colors duration-200"
                >
                  {t('loadMore', 'Load More')} ({segmentFlights.length - visibleCount} {t('remaining', 'remaining')})
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

interface FlightCardProps {
  flight: Flight;
  selectedFlight?: Flight | null;
  showDetails?: string | null;
  onFlightSelection: (flight: Flight) => void;
  onAddToCart?: (flight: Flight) => void;
  onShowDetails?: (flightId: string) => void;
}

const FlightCard: React.FC<FlightCardProps> = ({
  flight,
  selectedFlight,
  showDetails,
  onFlightSelection,
  onAddToCart,
  onShowDetails
}) => {
  const { t } = useTranslation();

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      {/* Flight Date Header */}
      <div className="mb-4 pb-2 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-tourtastic-blue" />
            <span className="text-sm font-medium text-gray-700">
              {format(new Date(flight.legs[0].from.date), 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {t('flightNumber', 'Flight')}: {flight.legs[0].segments[0].flightnumber}
          </span>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex-1 w-full">
          {flight.legs.map((leg, index) => (
            <div key={leg.leg_id} className={index > 0 ? 'mt-6 pt-6 border-t' : ''}>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-4 min-w-[200px] justify-center sm:justify-start">
                  <div className="flex flex-col items-center">
                    <img
                      src={getAirlineLogo(flight.airline_name || leg.segments[0].airline_name)}
                      alt={flight.airline_name || leg.segments[0].airline_name}
                      className="h-28 w-28 object-contain"
                    />
                    <span className="text-sm text-gray-700 text-center mt-1">
                      {flight.airline_name || leg.segments[0].airline_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {flight.airline_code || leg.segments[0].airline_code}
                    </span>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
                  <div className="flex flex-col items-center sm:items-start">
                    <span className="text-sm text-gray-500">{t('departure', 'Departure')}</span>
                    <div className="flex items-center gap-2">
                      {getTimeOfDayIcon(leg.from.date, 'h-4 w-4')}
                      <span className="font-medium">{format(new Date(leg.from.date), 'HH:mm')}</span>
                    </div>
                    <span className="text-sm">{leg.from.airport}</span>
                    <span className="text-xs text-gray-400">
                      {format(new Date(leg.from.date), 'MMM d')}
                    </span>
                    <div className={`flex items-center gap-1 text-xs mt-1 px-2 py-1 rounded-full ${
                      getTimeOfDayWithColor(leg.from.date).bgColor
                    }`}>
                      {getTimeOfDayIcon(leg.from.date)}
                      <span className={getTimeOfDayWithColor(leg.from.date).color}>
                        {t(getTimeOfDay(leg.from.date), getTimeOfDay(leg.from.date).charAt(0).toUpperCase() + getTimeOfDay(leg.from.date).slice(1))}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-sm text-gray-500">{t('duration', 'Duration')}</span>
                    <span className="font-medium">{flight.total_duration_formatted || `${Math.floor(leg.duration / 60)}h ${leg.duration % 60}m`}</span>
                    <div className="w-full h-px bg-gray-200 my-2"></div>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      {flight.stops_count === 0 ? (
                        <span className="flex items-center"><ArrowRightLeft className="h-3 w-3" /> {t('direct', 'Direct')}</span>
                      ) : (
                        <span className="flex items-center">
                          {flight.stops_count} <ArrowRightLeft className="h-3 w-3" /> 
                          {flight.stops_count === 1 ? t('stop', 'stop') : t('stops', 'stops')}
                          {flight.legs[0].stops_info && flight.legs[0].stops_info.length > 0 && (
                            <span className="ml-1 text-xs text-gray-400">
                              ({flight.legs[0].stops_info.map(stop => stop.airport).join(', ')})
                            </span>
                          )}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex flex-col items-center sm:items-end">
                    <span className="text-sm text-gray-500">{t('arrival', 'Arrival')}</span>
                    <div className="flex items-center gap-2">
                      {getTimeOfDayIcon(leg.to.date, 'h-4 w-4')}
                      <span className="font-medium">{format(new Date(leg.to.date), 'HH:mm')}</span>
                    </div>
                    <span className="text-sm">{leg.to.airport}</span>
                    <span className="text-xs text-gray-400">
                      {format(new Date(leg.to.date), 'MMM d')}
                    </span>
                    <div className={`flex items-center gap-1 text-xs mt-1 px-2 py-1 rounded-full ${
                      getTimeOfDayWithColor(leg.to.date).bgColor
                    }`}>
                      {getTimeOfDayIcon(leg.to.date)}
                      <span className={getTimeOfDayWithColor(leg.to.date).color}>
                        {t(getTimeOfDay(leg.to.date), getTimeOfDay(leg.to.date).charAt(0).toUpperCase() + getTimeOfDay(leg.to.date).slice(1))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Price and Action Section */}
        <div className="flex flex-col items-center lg:items-end gap-3 w-full lg:w-auto lg:min-w-[200px]">
          <div className="text-2xl font-bold text-center lg:text-right">
            {flight.currency} {flight.price}
          </div>
          <div className="text-sm text-gray-500 text-center lg:text-right">
            {t('perPerson', 'per person')}
          </div>
          <div className="text-xs text-gray-700 text-center lg:text-right">
            {(flight.search_query?.adt || 0) > 0 && `${flight.search_query.adt} ${t('adults', 'Adults')}`}
            {(flight.search_query?.chd || 0) > 0 && `, ${flight.search_query.chd} ${t('children', 'Children')}`}
            {(flight.search_query?.inf || 0) > 0 && `, ${flight.search_query.inf} ${t('infants', 'Infants')}`}
          </div>
          <div className="text-xs font-semibold text-tourtastic-blue text-center lg:text-right">
            {t('total', 'Total')}: {flight.currency} {
              (flight.search_query?.adt || 0) * ((flight.price_breakdowns?.ADT?.price || 0) + (flight.price_breakdowns?.ADT?.tax || 0)) +
              (flight.search_query?.chd || 0) * ((flight.price_breakdowns?.CHD?.price || 0) + (flight.price_breakdowns?.CHD?.tax || 0)) +
              (flight.search_query?.inf || 0) * ((flight.price_breakdowns?.INF?.price || 0) + (flight.price_breakdowns?.INF?.tax || 0))
            }
          </div>
          <div className="text-xs text-gray-600 text-center lg:text-right flex items-center justify-center lg:justify-end gap-1">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10l-8 4" />
            </svg>
            <span>{t('baggage', 'Baggage')}: {flight.baggage_allowance || flight.legs[0]?.bags?.ADT?.checked?.desc || 'N/A'}</span>
          </div>
          <Button
            onClick={() => onFlightSelection(flight)}
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
        <FlightDetails flight={flight} onAddToCart={onAddToCart} />
      )}
    </Card>
  );
};

interface FlightDetailsProps {
  flight: Flight;
  onAddToCart?: (flight: Flight) => void;
}

const FlightDetails: React.FC<FlightDetailsProps> = ({ flight, onAddToCart }) => {
  const { t } = useTranslation();

  return (
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
              <span>{flight.legs[0]?.cabin_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('baggageAllowance', 'Baggage Allowance')}</span>
              <span>{flight.baggage_allowance || flight.legs[0]?.bags?.ADT?.checked?.desc || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('refundable', 'Refundable')}</span>
              <span>{flight.refundable_info || 'N/A'}</span>
            </div>
          </div>
          
          {/* Flight segments information */}
          {flight.legs[0].segments.length > 1 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-md font-semibold">{t('flightSegments', 'Flight Segments')}</h4>
              {flight.legs[0].segments.map((segment, segIndex) => (
                <div key={segIndex} className="bg-gray-50 p-3 rounded border">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{segment.flightnumber}</span>
                      <span className="text-sm text-gray-600">{segment.airline_name}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {segment.duration_formatted || `${Math.floor(segment.duration / 60)}h ${segment.duration % 60}m`}
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <div>
                      <span className="font-medium">{format(new Date(segment.from.date), 'HH:mm')}</span>
                      <span className="text-gray-600 ml-1">{segment.from.airport}</span>
                      {segment.from.terminal && (
                        <span className="text-xs text-gray-500 ml-1">T{segment.from.terminal}</span>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        {getTimeOfDayIcon(segment.from.date)}
                        <span className={`text-xs ${getTimeOfDayWithColor(segment.from.date).color}`}>
                          {t(getTimeOfDay(segment.from.date), getTimeOfDay(segment.from.date))}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{format(new Date(segment.to.date), 'HH:mm')}</span>
                      <span className="text-gray-600 ml-1">{segment.to.airport}</span>
                      {segment.to.terminal && (
                        <span className="text-xs text-gray-500 ml-1">T{segment.to.terminal}</span>
                      )}
                      <div className="flex items-center gap-1 mt-1 justify-end">
                        {getTimeOfDayIcon(segment.to.date)}
                        <span className={`text-xs ${getTimeOfDayWithColor(segment.to.date).color}`}>
                          {t(getTimeOfDay(segment.to.date), getTimeOfDay(segment.to.date))}
                        </span>
                      </div>
                    </div>
                  </div>
                  {segment.equipment && (
                    <div className="text-xs text-gray-500 mt-1">
                      {t('aircraft', 'Aircraft')}: {segment.equipment_name || segment.equipment}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{t('priceBreakdown', 'Price Breakdown')}</h3>
            {(flight.search_query?.adt || 0) > 0 && (
              <div className="flex justify-between text-xs">
                <span>{flight.search_query.adt} × {t('adults', 'Adults')}</span>
                <span>
                  {flight.currency} {flight.price_breakdowns?.ADT?.price || 0} + {t('taxes', 'Taxes')}: {flight.currency} {flight.price_breakdowns?.ADT?.tax || 0} = {flight.currency} {(flight.search_query?.adt || 0) * ((flight.price_breakdowns?.ADT?.price || 0) + (flight.price_breakdowns?.ADT?.tax || 0))}
                </span>
              </div>
            )}
            {(flight.search_query?.chd || 0) > 0 && (
              <div className="flex justify-between text-xs">
                <span>{flight.search_query.chd} × {t('children', 'Children')}</span>
                <span>
                  {flight.currency} {flight.price_breakdowns?.CHD?.price || 0} + {t('taxes', 'Taxes')}: {flight.currency} {flight.price_breakdowns?.CHD?.tax || 0} = {flight.currency} {(flight.search_query?.chd || 0) * ((flight.price_breakdowns?.CHD?.price || 0) + (flight.price_breakdowns?.CHD?.tax || 0))}
                </span>
              </div>
            )}
            {(flight.search_query?.inf || 0) > 0 && (
              <div className="flex justify-between text-xs">
                <span>{flight.search_query.inf} × {t('infants', 'Infants')}</span>
                <span>
                  {flight.currency} {flight.price_breakdowns?.INF?.price || 0} + {t('taxes', 'Taxes')}: {flight.currency} {flight.price_breakdowns?.INF?.tax || 0} = {flight.currency} {(flight.search_query?.inf || 0) * ((flight.price_breakdowns?.INF?.price || 0) + (flight.price_breakdowns?.INF?.tax || 0))}
                </span>
              </div>
            )}
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
              <span>
                {flight.currency} {
                  (flight.search_query?.adt || 0) * ((flight.price_breakdowns?.ADT?.price || 0) + (flight.price_breakdowns?.ADT?.tax || 0)) +
                  (flight.search_query?.chd || 0) * ((flight.price_breakdowns?.CHD?.price || 0) + (flight.price_breakdowns?.CHD?.tax || 0)) +
                  (flight.search_query?.inf || 0) * ((flight.price_breakdowns?.INF?.price || 0) + (flight.price_breakdowns?.INF?.tax || 0))
                }
              </span>
            </div>
          </div>
          {onAddToCart && (
            <Button
              onClick={() => onAddToCart(flight)}
              className="mt-4 bg-tourtastic-blue hover:bg-tourtastic-dark-blue text-white flex items-center justify-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              {t('addToCart', 'Add to Cart')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlightResults;
export { FlightCard, FlightDetails };