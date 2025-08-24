import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Info, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Flight } from '../../services/flightService';
import { getTimeOfDay, getTimeOfDayIcon, getTimeOfDayWithColor } from './utils/flightHelpers';

interface FlightDetailsProps {
  flight: Flight;
  onAddToCart?: (flight: Flight) => void;
}

const FlightDetails: React.FC<FlightDetailsProps> = ({ flight, onAddToCart }) => {
  const { t } = useTranslation();

  const adtCount = flight.search_query?.adt || 0;
  const chdCount = flight.search_query?.chd || 0;
  const infCount = flight.search_query?.inf || 0;

  const breakdown = useMemo(() => {
    const adt = {
      price: flight.price_breakdowns?.ADT?.price ?? flight.price ?? 0,
      tax: flight.price_breakdowns?.ADT?.tax ?? flight.tax ?? 0,
      total: flight.price_breakdowns?.ADT?.total ?? ((flight.price ?? 0) + (flight.tax ?? 0)),
      label: flight.price_breakdowns?.ADT?.label || t('adults', 'بالغ'),
    };
    const chd = {
      price: flight.price_breakdowns?.CHD?.price ?? flight.price ?? 0,
      tax: flight.price_breakdowns?.CHD?.tax ?? flight.tax ?? 0,
      total: flight.price_breakdowns?.CHD?.total ?? ((flight.price ?? 0) + (flight.tax ?? 0)),
      label: flight.price_breakdowns?.CHD?.label || t('children', 'طفل'),
    };
    const inf = {
      price: flight.price_breakdowns?.INF?.price ?? flight.price ?? 0,
      tax: flight.price_breakdowns?.INF?.tax ?? flight.tax ?? 0,
      total: flight.price_breakdowns?.INF?.total ?? ((flight.price ?? 0) + (flight.tax ?? 0)),
      label: flight.price_breakdowns?.INF?.label || t('infants', 'رضيع'),
    };
    return { adt, chd, inf };
  }, [flight.price_breakdowns, flight.price, flight.tax, t]);

  const grandTotal = useMemo(() => {
    return (
      adtCount * breakdown.adt.total +
      chdCount * breakdown.chd.total +
      infCount * breakdown.inf.total
    );
  }, [adtCount, chdCount, infCount, breakdown]);

  return (
    <div className="mt-6 pt-6 border-t">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Info className="h-5 w-5 text-tourtastic-blue" />
            {t('flightDetails', 'تفاصيل الرحلة')}
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">{t('cabinClass', 'درجة المقصورة')}</span>
              <span>{t(`cabinTypes.${flight.legs[0]?.cabin_name}`, {
                'Economy': 'اقتصادية',
                'Business': 'رجال الأعمال',
                'First': 'الأولى',
                'Premium': 'الممتازة'
              }[flight.legs[0]?.cabin_name] || 'غير متوفر')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('baggageAllowance', 'الأمتعة المسموح بها')}</span>
              <span>
                {flight.baggage_allowance ? (
                  // Parse baggage format like "1 piece (23kg)" or "2 pieces (20kg each)"
                  flight.baggage_allowance.replace(/(\d+)\s*piece(?:s)?\s*\((\d+)kg(?:\s*each)?\)/i, (_, pieces, weight) => 
                    `${pieces} ${Number(pieces) === 1 ? t('baggageDetails.piece', 'قطعة') : t('baggageDetails.pieces', 'قطع')} (${weight} ${t('baggageDetails.kg', 'كجم')})`
                  )
                ) : flight.legs[0]?.bags?.ADT?.checked?.desc ? (
                  flight.legs[0].bags.ADT.checked.desc.replace(/(\d+)\s*piece(?:s)?\s*\((\d+)kg(?:\s*each)?\)/i, (_, pieces, weight) => 
                    `${pieces} ${Number(pieces) === 1 ? t('baggageDetails.piece', 'قطعة') : t('baggageDetails.pieces', 'قطع')} (${weight} ${t('baggageDetails.kg', 'كجم')})`
                  )
                ) : t('noBaggageIncluded', 'لا تشمل أمتعة')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('refundable', 'قابل للاسترداد')}</span>
              <span className={`font-medium ${flight.can_refund ? 'text-green-600' : 'text-red-600'}`}>
                {flight.can_refund ? t('yes', 'نعم') : t('no', 'لا')}
              </span>
            </div>
            {flight.refundable_info && (
              <div className="text-xs text-gray-600">{flight.refundable_info}</div>
            )}
          </div>
          {/* Flight segments information */}
          {flight.legs[0].segments.length > 1 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-md font-semibold">{t('flightSegments', 'محطات الرحلة')}</h4>
              {flight.legs[0].segments.map((segment, segIndex) => (
                <div key={segIndex} className="bg-gray-50 p-3 rounded border">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{segment.flightnumber}</span>
                      <span className="text-sm text-gray-600">
                        {t(`airlines.${segment.airline_name}`, {
                          'Flynas': 'طيران ناس',
                          'flyadeal': 'طيران أديل',
                          'Air Arabia Egypt': 'العربية للطيران مصر',
                          'Air Cairo': 'مصر للطيران القاهرة',
                          'EgyptAir': 'مصر للطيران',
                          'Saudi Arabian Airlines': 'الخطوط السعودية'
                        }[segment.airline_name] || segment.airline_name)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {segment.duration_formatted || `${Math.floor(segment.duration / 60)} ${t('hour', {
                        count: Math.floor(segment.duration / 60),
                        one: 'ساعة',
                        other: 'ساعات'
                      })} ${segment.duration % 60} ${t('minute', {
                        count: segment.duration % 60,
                        one: 'دقيقة',
                        other: 'دقائق'
                      })}`}
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{format(new Date(segment.from.date), 'HH:mm')}</span>
                        <div className="flex items-center gap-1">
                          {getTimeOfDayIcon(segment.from.date)}
                          <span className={`text-xs ${getTimeOfDayWithColor(segment.from.date).color}`}>
                            {t(`timeOfDay.${getTimeOfDay(segment.from.date)}`, getTimeOfDayWithColor(segment.from.date).text)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600">{segment.from.airport}</span>
                        {segment.from.terminal && (
                          <span className="text-xs text-gray-500">T{segment.from.terminal}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="flex items-center gap-1">
                          {getTimeOfDayIcon(segment.to.date)}
                          <span className={`text-xs ${getTimeOfDayWithColor(segment.to.date).color}`}>
                            {t(`timeOfDay.${getTimeOfDay(segment.to.date)}`, getTimeOfDayWithColor(segment.to.date).text)}
                          </span>
                        </div>
                        <span className="font-medium">{format(new Date(segment.to.date), 'HH:mm')}</span>
                      </div>
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-gray-600">{segment.to.airport}</span>
                        {segment.to.terminal && (
                          <span className="text-xs text-gray-500">T{segment.to.terminal}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {segment.equipment && (
                    <div className="text-xs text-gray-500 mt-1">
                      {t('aircraft', 'الطائرة')}: {segment.equipment_name || segment.equipment}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{t('priceBreakdown', 'تفاصيل السعر')}</h3>
            {adtCount > 0 && (
              <div className="flex justify-between text-sm border-b pb-2">
                <span className="font-medium">{adtCount} × {t('adults', 'بالغ')}</span>
                <div className="text-right">
                  <div>{flight.currency} {breakdown.adt.total.toFixed(2)} {t('each', 'للشخص')}</div>
                  <div className="text-xs text-gray-500">
                    {t('base', 'السعر الأساسي')}: {flight.currency} {breakdown.adt.price.toFixed(2)} + {t('tax', 'الضرائب')}: {flight.currency} {breakdown.adt.tax.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {t('subtotal', 'المجموع الفرعي')}: {flight.currency} {(breakdown.adt.total * adtCount).toFixed(2)}
                  </div>
                </div>
              </div>
            )}
            {chdCount > 0 && (
              <div className="flex justify-between text-sm border-b pb-2">
                <span className="font-medium">{chdCount} × {t('children', 'طفل')}</span>
                <div className="text-right">
                  <div>{flight.currency} {breakdown.chd.total.toFixed(2)} {t('each', 'للشخص')}</div>
                  <div className="text-xs text-gray-500">
                    {t('base', 'السعر الأساسي')}: {flight.currency} {breakdown.chd.price.toFixed(2)} + {t('tax', 'الضرائب')}: {flight.currency} {breakdown.chd.tax.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {t('subtotal', 'المجموع الفرعي')}: {flight.currency} {(breakdown.chd.total * chdCount).toFixed(2)}
                  </div>
                </div>
              </div>
            )}
            {infCount > 0 && (
              <div className="flex justify-between text-sm border-b pb-2">
                <span className="font-medium">{infCount} × {t('infants', 'رضيع')}</span>
                <div className="text-right">
                  <div>{flight.currency} {breakdown.inf.total.toFixed(2)} {t('each', 'للشخص')}</div>
                  <div className="text-xs text-gray-500">
                    {t('base', 'السعر الأساسي')}: {flight.currency} {breakdown.inf.price.toFixed(2)} + {t('tax', 'الضرائب')}: {flight.currency} {breakdown.inf.tax.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {t('subtotal', 'المجموع الفرعي')}: {flight.currency} {(breakdown.inf.total * infCount).toFixed(2)}
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">{t('baseFare', 'السعر الأساسي')}</span>
              <span>{flight.currency} {(flight.price || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('taxes', 'الضرائب')}</span>
              <span>{flight.currency} {(flight.tax || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>{t('total', 'المجموع')}</span>
              <span>{flight.currency} {grandTotal.toFixed(2)}</span>
            </div>
          </div>
          {onAddToCart && (
            <Button
              onClick={() => onAddToCart(flight)}
              className="mt-4 bg-tourtastic-blue hover:bg-tourtastic-dark-blue text-white flex items-center justify-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              {t('addToCart', 'إضافة إلى السلة')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlightDetails;