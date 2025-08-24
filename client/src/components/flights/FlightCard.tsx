import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Plane } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flight } from '../../services/flightService';
import { getAirlineLogo, getTimeOfDay, getTimeOfDayIcon, getTimeOfDayWithColor } from './utils/flightHelpers';

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

  // Calculate totals and adult base/tax
  const { totalPrice, adultBase, adultTax } = useMemo(() => {
    const adtPrice = flight.price_breakdowns?.ADT?.price ?? flight.price ?? 0;
    const adtTax = flight.price_breakdowns?.ADT?.tax ?? flight.tax ?? 0;

    const adtTotal = (flight.search_query?.adt || 0) * (adtPrice + adtTax);
    const chdPrice = flight.price_breakdowns?.CHD?.price ?? flight.price ?? 0;
    const chdTax = flight.price_breakdowns?.CHD?.tax ?? flight.tax ?? 0;
    const chdTotal = (flight.search_query?.chd || 0) * (chdPrice + chdTax);
    const infPrice = flight.price_breakdowns?.INF?.price ?? flight.price ?? 0;
    const infTax = flight.price_breakdowns?.INF?.tax ?? flight.tax ?? 0;
    const infTotal = (flight.search_query?.inf || 0) * (infPrice + infTax);

    return {
      totalPrice: adtTotal + chdTotal + infTotal,
      adultBase: adtPrice,
      adultTax: adtTax,
    };
  }, [flight.price_breakdowns, flight.price, flight.tax, flight.search_query]);

  return (
    <Card className={`p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 ${
      selectedFlight?.trip_id === flight.trip_id 
        ? 'border-l-tourtastic-blue bg-blue-50' 
        : 'border-l-transparent hover:border-l-tourtastic-blue'
    }`}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Flight Info Section */}
        <div className="flex-1 space-y-4">
          {/* Date and Flight Number */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="font-medium">
              {t(`months.${format(new Date(flight.legs[0].segments[0].from.date), 'MMM')}`, {
                Jan: 'يناير',
                Feb: 'فبراير',
                Mar: 'مارس',
                Apr: 'أبريل',
                May: 'مايو',
                Jun: 'يونيو',
                Jul: 'يوليو',
                Aug: 'أغسطس',
                Sep: 'سبتمبر',
                Oct: 'أكتوبر',
                Nov: 'نوفمبر',
                Dec: 'ديسمبر'
              }[format(new Date(flight.legs[0].segments[0].from.date), 'MMM')])}{' '}
              {format(new Date(flight.legs[0].segments[0].from.date), 'dd')},{' '}
              {format(new Date(flight.legs[0].segments[0].from.date), 'yyyy')}
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
                  className="h-20 w-20 sm:h-32 sm:w-32 lg:h-40 lg:w-40 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {t(`airlines.${leg.segments[0].airline_name}`, {
                      'Flynas': 'طيران ناس',
                      'flyadeal': 'طيران أديل',
                      'Air Arabia Egypt': 'العربية للطيران مصر',
                      'Air Cairo': 'مصر للطيران القاهرة',
                      'EgyptAir': 'مصر للطيران',
                      'Saudi Arabian Airlines': 'الخطوط السعودية'
                    }[leg.segments[0].airline_name] || leg.segments[0].airline_name)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {leg.segments[0].iata} {leg.segments[0].flightnumber}
                  </div>
                </div>
              </div>
              
              {/* Flight Route */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
                {/* Departure */}
                <div className="w-[45%] sm:w-auto sm:flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl sm:text-2xl font-bold text-gray-900">
                      {format(new Date(leg.segments[0].from.date), 'HH:mm')}
                    </span>
                    <div className="flex items-center gap-1">
                      {getTimeOfDayIcon(leg.segments[0].from.date)}
                      <span className={`text-xs ${getTimeOfDayWithColor(leg.segments[0].from.date).color}`}>
                        {t(`timeOfDay.${getTimeOfDay(leg.segments[0].from.date)}`, getTimeOfDayWithColor(leg.segments[0].from.date).text)}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-700 truncate max-w-[120px] sm:max-w-[150px]">
                    {t(`airports.${leg.segments[0].from.airport}`, leg.segments[0].from.airport)}
                  </div>
                  <div className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-[150px]">
                    {t(`cities.${leg.segments[0].from.city}`, {
                      'Cairo': 'القاهرة',
                      'Jeddah': 'جدة'
                    }[leg.segments[0].from.city] || leg.segments[0].from.city)}
                  </div>
                </div>
                
                {/* Flight Duration and Stops */}
                <div className="w-[30%] sm:w-auto sm:flex-1 text-center px-2 mx-1">
                  <div className="text-xs sm:text-sm text-gray-600 mb-1 text-center">
                    {leg.duration_formatted || `${Math.floor(leg.duration / 60)} ${t('hour', {
                      count: Math.floor(leg.duration / 60),
                      one: 'ساعة',
                      other: 'ساعات'
                    })} ${leg.duration % 60} ${t('minute', {
                      count: leg.duration % 60,
                      one: 'دقيقة',
                      other: 'دقائق'
                    })}`}
                  </div>
                  <div className="hidden sm:flex items-center justify-center mb-1">
                    <div className="h-px bg-gray-300 flex-1"></div>
                    <Plane className="h-4 w-4 text-tourtastic-blue mx-2" />
                    <div className="h-px bg-gray-300 flex-1"></div>
                  </div>
                  <div className="flex sm:hidden items-center justify-center mb-1">
                    <div className="h-px bg-gray-300 flex-1 max-w-[30px]"></div>
                    <Plane className="h-3 w-3 text-tourtastic-blue mx-1" />
                    <div className="h-px bg-gray-300 flex-1 max-w-[30px]"></div>
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500">
                    {leg.stops_count === 0 ? t('direct', 'مباشرة') : 
                     leg.stops_count === 1 ? t('oneStop', 'محطة واحدة') : 
                     t('multipleStops', `${leg.stops_count} محطات`)}
                  </div>
                </div>                {/* Arrival */}
                <div className="w-[45%] sm:w-auto sm:flex-1 flex flex-col ml-auto">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <div className="flex items-center gap-1">
                      {getTimeOfDayIcon(leg.segments[leg.segments.length - 1].to.date)}
                      <span className={`text-xs ${getTimeOfDayWithColor(leg.segments[leg.segments.length - 1].to.date).color}`}>
                        {t(`timeOfDay.${getTimeOfDay(leg.segments[leg.segments.length - 1].to.date)}`, getTimeOfDayWithColor(leg.segments[leg.segments.length - 1].to.date).text)}
                      </span>
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-gray-900">
                      {format(new Date(leg.segments[leg.segments.length - 1].to.date), 'HH:mm')}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-700 truncate max-w-[120px] sm:max-w-[150px] ml-auto">
                    {t(`airports.${leg.segments[leg.segments.length - 1].to.airport}`, leg.segments[leg.segments.length - 1].to.airport)}
                  </div>
                  <div className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-[150px] ml-auto">
                    {t(`cities.${leg.segments[leg.segments.length - 1].to.city}`, {
                      'Cairo': 'القاهرة',
                      'Jeddah': 'جدة'
                    }[leg.segments[leg.segments.length - 1].to.city] || leg.segments[leg.segments.length - 1].to.city)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Price and Action Section */}
        <div className="flex flex-col items-center lg:items-end gap-3 w-full lg:w-auto lg:min-w-[220px] px-2 sm:px-4">
          {/* Black price: adult base */}
          <div className="text-xl sm:text-2xl font-bold text-center lg:text-right break-words">
            {flight.currency} {adultBase.toFixed(2)}
          </div>
          <div className="text-xs text-gray-600 text-center lg:text-right whitespace-normal">
            {t('perAdult', 'للبالغ')} {t('base', 'السعر الأساسي')}
          </div>
          {/* Adult tax line */}
          <div className="text-xs text-gray-600 text-center lg:text-right whitespace-normal">
            {t('tax', 'الضرائب')}: {flight.currency} {adultTax.toFixed(2)}
          </div>

          {/* Passenger counts */}
          <div className="text-xs text-gray-700 text-center lg:text-right">
            {(flight.search_query?.adt || 0) > 0 && `${flight.search_query.adt} ${t('adults', 'بالغ')}`}
            {(flight.search_query?.chd || 0) > 0 && ` ${flight.search_query.chd} ${t('children', 'طفل')}`}
            {(flight.search_query?.inf || 0) > 0 && ` ${flight.search_query.inf} ${t('infants', 'رضيع')}`}
          </div>
          
          {/* Blue total */}
          <div className="text-xs font-semibold text-tourtastic-blue text-center lg:text-right">
            {t('total', 'المجموع')}: {flight.currency} {totalPrice.toFixed(2)}
          </div>

          <div className="text-xs text-gray-600 text-center lg:text-right flex items-center justify-center lg:justify-end gap-1 px-2 max-w-full">
            <svg className="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m0-10L4 7m8 4v10l-8 4m0-10L4 7m8 4v10l-8 4" />
            </svg>
            <span className="truncate">{t('baggage', 'الأمتعة')}: {flight.baggage_allowance || flight.legs[0]?.bags?.ADT?.checked?.desc || t('noBaggageIncluded', 'لا تشمل أمتعة')}</span>
          </div>
          <Button
            onClick={() => {
              if (selectedFlight?.trip_id === flight.trip_id && showDetails === flight.trip_id) {
                onFlightSelection(null);
              } else {
                onFlightSelection(flight);
              }
            }}
            className="w-full lg:w-auto bg-tourtastic-blue hover:bg-tourtastic-dark-blue text-white transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg dir-rtl"
          >
            {selectedFlight?.trip_id === flight.trip_id ? (
              <div className="flex items-center gap-2">
                <span>✓</span>
                {showDetails === flight.trip_id ? t('collapse', 'طي التفاصيل') : t('selected', 'تم الاختيار')}
              </div>
            ) : (
              t('select', 'اختيار الرحلة')
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default FlightCard;