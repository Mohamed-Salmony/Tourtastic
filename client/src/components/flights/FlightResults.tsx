import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Plane, Info, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Flight } from '../../services/flightService';
import { getAirlineLogo } from './utils/flightHelpers';

// Helper function to get time of day
const getTimeOfDay = (dateString: string) => {
  const hour = new Date(dateString).getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

// Helper function to get time of day icon
const getTimeOfDayIcon = (dateString: string) => {
  const timeOfDay = getTimeOfDay(dateString);
  switch (timeOfDay) {
    case 'morning': return '🌅';
    case 'afternoon': return '☀️';
    case 'evening': return '🌆';
    case 'night': return '🌙';
    default: return '🕐';
  }
};

// Helper function to get time of day with color
const getTimeOfDayWithColor = (dateString: string, t: (key: string, fallback: string) => string) => {
  const timeOfDay = getTimeOfDay(dateString);
  switch (timeOfDay) {
    case 'morning': return { text: t('timeOfDay.morning', 'Morning'), color: 'text-orange-500' };
    case 'afternoon': return { text: t('timeOfDay.afternoon', 'Afternoon'), color: 'text-yellow-500' };
    case 'evening': return { text: t('timeOfDay.evening', 'Evening'), color: 'text-purple-500' };
    case 'night': return { text: t('timeOfDay.night', 'Night'), color: 'text-blue-500' };
    default: return { text: t('timeOfDay.day', 'Day'), color: 'text-gray-500' };
  }
};

// Update the interface
interface FlightResultsProps {
  flights: Flight[];
  onFlightSelection: (flight: Flight) => void;
  selectedFlight?: Flight;
  onAddToCart?: (flight: Flight) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  showDetails?: string | null;
}

// Update the FlightResults component
const FlightResults: React.FC<FlightResultsProps> = ({
  flights,
  onFlightSelection,
  selectedFlight,
  onAddToCart,
  onLoadMore,
  hasMore = false,
  loading = false,
  showDetails
}) => {
  const { t } = useTranslation();
  const handleFlightSelection = (flight: Flight) => {
    onFlightSelection(flight);
  };

  if (flights.length === 0) {
    return (
      <div className="text-center py-12">
        <Plane className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('noFlightsFound', 'No flights found')}
        </h3>
        <p className="text-gray-500">
          {t('tryAdjustingFilters', 'Try adjusting your search criteria or filters')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Display flights without grouping by date for simpler pagination */}
      <div className="space-y-4">
        {flights.map((flight) => (
          <FlightCard
            key={flight.trip_id}
            flight={flight}
            onFlightSelection={handleFlightSelection}
            selectedFlight={selectedFlight}
            showDetails={showDetails}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center py-6">
          <Button
            onClick={() => onLoadMore && onLoadMore()}
            disabled={loading}
            className="bg-tourtastic-blue hover:bg-tourtastic-dark-blue text-white px-8 py-2"
          >
            {loading ? t('loading', 'Loading...') : t('loadMore', 'Load More Flights')}
          </Button>
        </div>
      )}
    </div>
  );
};

interface FlightCardProps {
  flight: Flight;
  onFlightSelection: (flight: Flight) => void;
  selectedFlight?: Flight;
  showDetails?: string | null;
  onAddToCart?: (flight: Flight) => void;
}

const FlightCard: React.FC<FlightCardProps> = ({
  flight,
  onFlightSelection,
  selectedFlight,
  showDetails,
  onAddToCart
}) => {
  const { t } = useTranslation();

  // Calculate total price using useMemo
  const totalPrice = useMemo(() => {
    // First try to use the pre-calculated total_price from backend
    if (flight.total_price && flight.total_price > 0) {
      return flight.total_price;
    }

    // Fallback: calculate manually using price + tax for single passenger
    // then multiply by passenger count
    const singlePassengerTotal = (flight.price || 0) + (flight.tax || 0);

    // If we have detailed breakdowns, use them
    if (flight.price_breakdowns) {
      const adtTotal = (flight.search_query?.adt || 0) * (flight.price_breakdowns.ADT?.total || singlePassengerTotal);
      const chdTotal = (flight.search_query?.chd || 0) * (flight.price_breakdowns.CHD?.total || singlePassengerTotal * 0.75);
      const infTotal = (flight.search_query?.inf || 0) * (flight.price_breakdowns.INF?.total || singlePassengerTotal * 0.1);
      return adtTotal + chdTotal + infTotal;
    }

    // Simple fallback for single adult passenger
    const totalPassengers = (flight.search_query?.adt || 1) + (flight.search_query?.chd || 0) + (flight.search_query?.inf || 0);
    return singlePassengerTotal * totalPassengers;
  }, [flight.search_query, flight.price_breakdowns, flight.total_price, flight.price, flight.tax]);

  return (
    <Card className={`p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 ${selectedFlight?.trip_id === flight.trip_id
        ? 'border-l-tourtastic-blue bg-blue-50'
        : 'border-l-transparent hover:border-l-tourtastic-blue'
      }`}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Flight Info Section */}
        <div className="flex-1 space-y-4">
          {/* Date and Flight Number */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="font-medium">
              {format(new Date(flight.legs[0].segments[0].from.date), 'EEE, MMM d')}
            </span>
            <span>•</span>
            <span>{flight.legs[0].segments[0].flightnumber}</span>
          </div>

          {flight.legs.map((leg, legIndex) => (
            <div key={legIndex} className="space-y-3">
              {/* Airline Info */}
              <div className="flex items-center gap-3">
                <img
                  src={getAirlineLogo(leg.segments[0].iata)}
                  alt={leg.segments[0].iata}
                  className="h-40 w-40 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
                <div>
                  <div className="font-medium text-gray-900">
                    {leg.segments[0].airline_name || leg.segments[0].iata}
                  </div>
                  <div className="text-sm text-gray-500">
                    {leg.segments[0].iata} {leg.segments[0].flightnumber}
                  </div>
                </div>
              </div>

              {/* Flight Route */}
              <div className="flex items-center gap-4">
                {/* Departure */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl font-bold text-gray-900">
                      {format(new Date(leg.segments[0].from.date), 'HH:mm')}
                    </span>
                    <div className="flex items-center gap-1">
                      {getTimeOfDayIcon(leg.segments[0].from.date)}
                      <span className={`text-xs ${getTimeOfDayWithColor(leg.segments[0].from.date, t).color}`}>
                        {getTimeOfDayWithColor(leg.segments[0].from.date, t).text}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    {leg.segments[0].from.airport}
                  </div>
                  <div className="text-xs text-gray-500">
                    {leg.segments[0].from.city}
                  </div>
                </div>

                {/* Flight Duration and Stops */}
                <div className="flex-1 text-center">
                  <div className="text-sm text-gray-600 mb-1">
                    {leg.duration_formatted || `${Math.floor(leg.duration / 60)}h ${leg.duration % 60}m`}
                  </div>
                  <div className="flex items-center justify-center mb-1">
                    <div className="h-px bg-gray-300 flex-1"></div>
                    <Plane className="h-4 w-4 text-tourtastic-blue mx-2" />
                    <div className="h-px bg-gray-300 flex-1"></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {leg.stops_count === 0 ? t('nonstop', 'Nonstop') :
                      leg.stops_count === 1 ? t('oneStop', '1 stop') :
                        t('multipleStops', `${leg.stops_count} stops`)}
                  </div>
                </div>

                {/* Arrival */}
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <div className="flex items-center gap-1">
                      {getTimeOfDayIcon(leg.segments[leg.segments.length - 1].to.date)}
                      <span className={`text-xs ${getTimeOfDayWithColor(leg.segments[leg.segments.length - 1].to.date, t).color}`}>
                        {getTimeOfDayWithColor(leg.segments[leg.segments.length - 1].to.date, t).text}
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">
                      {format(new Date(leg.segments[leg.segments.length - 1].to.date), 'HH:mm')}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    {leg.segments[leg.segments.length - 1].to.airport}
                  </div>
                  <div className="text-xs text-gray-500">
                    {leg.segments[leg.segments.length - 1].to.city}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Price and Action Section */}
          <div className="flex flex-col items-center lg:items-end gap-3 w-full lg:w-auto lg:min-w-[200px]">
            {/* Per Person Price (Adult Rate) - Show First */}
            <div className="text-center lg:text-right">
              <div className="text-2xl font-bold text-gray-900">
                {flight.currency} {((flight.price_breakdowns?.ADT?.total || 0)).toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">
                {t('perPerson', 'per person')}
              </div>
              <div className="text-xs text-gray-400">
                {t('baseFare', 'Base')}: {flight.currency} {(flight.price_breakdowns?.ADT?.price || 0).toFixed(2)} + 
                {t('taxes', 'Taxes')}: {flight.currency} {(flight.price_breakdowns?.ADT?.tax || 0).toFixed(2)}
              </div>
            </div>          {/* Total Price for All Passengers - Show Second */}
          <div className="text-center lg:text-right">
            <div className="text-lg font-semibold text-tourtastic-blue">
              {t('total', 'Total')}: {flight.currency} {totalPrice.toFixed(2)}
            </div>
            <div className="text-xs text-gray-600">
              {(flight.search_query?.adt || 0) > 0 && `${flight.search_query.adt} ${t('adults', 'Adults')}`}
              {(flight.search_query?.chd || 0) > 0 && `, ${flight.search_query.chd} ${t('children', 'Children')}`}
              {(flight.search_query?.inf || 0) > 0 && `, ${flight.search_query.inf} ${t('infants', 'Infants')}`}
            </div>
          </div>

          {/* Baggage Info */}
          <div className="text-xs text-gray-600 text-center lg:text-right flex items-center justify-center lg:justify-end gap-1">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m0-10L4 7m8 4v10l-8 4m0-10L4 7m8 4v10l-8 4" />
            </svg>
            <span>{t('baggage', 'Baggage')}: {flight.baggage_allowance || flight.legs[0]?.bags?.ADT?.checked?.desc || 'N/A'}</span>
          </div>

          {/* Select Button */}
          <Button
            onClick={() => onFlightSelection(flight)}
            className="w-full lg:w-auto bg-tourtastic-blue hover:bg-tourtastic-dark-blue text-white transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
          >
            {selectedFlight?.trip_id === flight.trip_id ? (
              <div className="flex items-center gap-2">
                <span>✓</span>
                {t('selected', 'تم الاختيار')}
              </div>
            ) : (
              t('select', 'اختر')
            )}
          </Button>
        </div>
      </div>

      {/* Flight Details Sectio */}
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
                  <span>{t(`cabinTypes.${flight.legs[0]?.cabin_name?.toLowerCase()}`, flight.legs[0]?.cabin_name) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('baggageAllowance', 'Baggage Allowance')}</span>
                  <span>{flight.baggage_allowance ? t('baggageDesc', '{{count}} pieces ({{weight}}kg each)', {
                    count: parseInt(flight.baggage_allowance.split(' ')[0]),
                    weight: flight.baggage_allowance.match(/\((\d+)kg/)?.[1] || '23'
                  }) : 'N/A'}</span>
                </div>
                {/* Refundable Information */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('refundable', 'Refundable')}</span>
                    <span className={`font-medium ${
                      flight.can_refund ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {flight.can_refund ? t('yes', 'Yes') : t('no', 'No')}
                    </span>
                  </div>
                  
                  {flight.refundable_info && (
                    <div className="text-xs text-gray-600">
                      {flight.refundable_info}
                    </div>
                  )}
                  
                  {/* Additional Booking Capabilities */}
                  <div className="text-xs text-gray-500 space-y-1">
                    {flight.can_hold && <div>✓ {t('canBeHeld', 'Can be held')}</div>}
                    {flight.can_void && <div>✓ {t('canBeVoided', 'Can be voided')}</div>}
                    {flight.can_exchange && <div>✓ {t('canBeExchanged', 'Can be exchanged')}</div>}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between">
              <div className="space-y-2">
                {/* Detailed Price Breakdown for All Passenger Types */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{t('priceBreakdown', 'Price Breakdown')}</h3>
                  
                  {/* Adults */}
                  {(flight.search_query?.adt || 0) > 0 && flight.price_breakdowns?.ADT && (
                    <div className="flex justify-between text-sm border-b pb-2">
                      <span className="font-medium">
                        {flight.search_query.adt} × {t('adultPassenger', 'Adult')}
                      </span>
                      <div className="text-right">
                        <div>{flight.currency} {flight.price_breakdowns.ADT.total.toFixed(2)} {t('perPerson', 'per person')}</div>
                        <div className="text-xs text-gray-500">
                          {t('baseFare', 'Base')}: {flight.currency} {flight.price_breakdowns.ADT.price.toFixed(2)} + 
                          {t('taxes', 'Taxes')}: {flight.currency} {flight.price_breakdowns.ADT.tax.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {t('subtotalAmount', 'Subtotal')}: {flight.currency} {(flight.price_breakdowns.ADT.total * flight.search_query.adt).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Children */}
                  {(flight.search_query?.chd || 0) > 0 && flight.price_breakdowns?.CHD && (
                    <div className="flex justify-between text-sm border-b pb-2">
                      <span className="font-medium">
                        {flight.search_query.chd} × {flight.price_breakdowns.CHD.label || t('children', 'Children')}
                      </span>
                      <div className="text-right">
                        <div>{flight.currency} {flight.price_breakdowns.CHD.total.toFixed(2)} {t('each', 'each')}</div>
                        <div className="text-xs text-gray-500">
                          {t('base', 'Base')}: {flight.currency} {flight.price_breakdowns.CHD.price.toFixed(2)} + 
                          {t('tax', 'Tax')}: {flight.currency} {flight.price_breakdowns.CHD.tax.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {t('subtotal', 'Subtotal')}: {flight.currency} {(flight.price_breakdowns.CHD.total * flight.search_query.chd).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Infants */}
                  {(flight.search_query?.inf || 0) > 0 && flight.price_breakdowns?.INF && (
                    <div className="flex justify-between text-sm border-b pb-2">
                      <span className="font-medium">
                        {flight.search_query.inf} × {flight.price_breakdowns.INF.label || t('infants', 'Infants')}
                      </span>
                      <div className="text-right">
                        <div>{flight.currency} {flight.price_breakdowns.INF.total.toFixed(2)} {t('each', 'each')}</div>
                        <div className="text-xs text-gray-500">
                          {t('base', 'Base')}: {flight.currency} {flight.price_breakdowns.INF.price.toFixed(2)} + 
                          {t('tax', 'Tax')}: {flight.currency} {flight.price_breakdowns.INF.tax.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {t('subtotal', 'Subtotal')}: {flight.currency} {(flight.price_breakdowns.INF.total * flight.search_query.inf).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Total Summary */}
                <div className="border-t pt-2 space-y-1">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>{t('grandTotal', 'Grand Total')}</span>
                    <span>{flight.currency} {totalPrice.toFixed(2)}</span>
                  </div>
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

        </div>

        <div className="flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{t('priceBreakdown', 'Price Breakdown')}</h3>
            {(flight.search_query?.adt || 0) > 0 && (
              <div className="flex justify-between text-xs">
                <span>{flight.search_query.adt} × {t('adults', 'Adults')}</span>
                <span>
                  {flight.currency} {(flight.price_breakdowns?.ADT?.price || 0).toFixed(2)} + {t('taxes', 'Taxes')}: {flight.currency} {(flight.price_breakdowns?.ADT?.tax || 0).toFixed(2)} = {flight.currency} {(((flight.search_query?.adt || 0) * ((flight.price_breakdowns?.ADT?.price || 0) + (flight.price_breakdowns?.ADT?.tax || 0)))).toFixed(2)}
                </span>
              </div>
            )}
            {(flight.search_query?.chd || 0) > 0 && (
              <div className="flex justify-between text-xs">
                <span>{flight.search_query.chd} × {t('children', 'Children')}</span>
                <span>
                  {flight.currency} {(flight.price_breakdowns?.CHD?.price || 0).toFixed(2)} + {t('taxes', 'Taxes')}: {flight.currency} {(flight.price_breakdowns?.CHD?.tax || 0).toFixed(2)} = {flight.currency} {(((flight.search_query?.chd || 0) * ((flight.price_breakdowns?.CHD?.price || 0) + (flight.price_breakdowns?.CHD?.tax || 0)))).toFixed(2)}
                </span>
              </div>
            )}
            {(flight.search_query?.inf || 0) > 0 && (
              <div className="flex justify-between text-xs">
                <span>{flight.search_query.inf} × {t('infants', 'Infants')}</span>
                <span>
                  {flight.currency} {(flight.price_breakdowns?.INF?.price || 0).toFixed(2)} + {t('taxes', 'Taxes')}: {flight.currency} {(flight.price_breakdowns?.INF?.tax || 0).toFixed(2)} = {flight.currency} {(((flight.search_query?.inf || 0) * ((flight.price_breakdowns?.INF?.price || 0) + (flight.price_breakdowns?.INF?.tax || 0)))).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">{t('baseFare', 'Base Fare')}</span>
              <span>{flight.currency} {(flight.price || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('taxes', 'Taxes')}</span>
              <span>{flight.currency} {(flight.tax || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>{t('total', 'Total')}</span>
              <span>
                {flight.currency} {(
                  ((flight.search_query?.adt || 0) * (((flight.price_breakdowns?.ADT?.price || 0)) + ((flight.price_breakdowns?.ADT?.tax || 0)))) +
                  ((flight.search_query?.chd || 0) * (((flight.price_breakdowns?.CHD?.price || 0)) + ((flight.price_breakdowns?.CHD?.tax || 0)))) +
                  ((flight.search_query?.inf || 0) * (((flight.price_breakdowns?.INF?.price || 0)) + ((flight.price_breakdowns?.INF?.tax || 0))))
                ).toFixed(2)}
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


