import React, { useMemo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Info, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Flight } from '../../services/flightService';
import { getTimeOfDay, getTimeOfDayIcon, getTimeOfDayWithColor, formatBaggage } from './utils/flightHelpers';
import { getAirportsMap } from '@/services/airportService';

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

  const [airportsMap, setAirportsMap] = useState<Record<string, import('@/services/airportService').Airport>>({});
  const { i18n } = useTranslation();

  const getLocalizedAirline = (airlineName?: string, airlineCode?: string) => {
    if (!airlineName && !airlineCode) return '';
    if (airlineName) {
      const key = `airlines.${airlineName}`;
      if (i18n.exists && i18n.exists(key)) return t(key);
    }
    if (airlineCode) {
      const keyCode = `airlines.${airlineCode}`;
      if (i18n.exists && i18n.exists(keyCode)) return t(keyCode);
    }
    return airlineName || airlineCode || '';
  };

  useEffect(() => {
    let mounted = true;
    const lang = i18n.language === 'ar' ? 'ar' : 'en';
    getAirportsMap(lang).then(map => {
      if (mounted) setAirportsMap(map || {});
    }).catch(() => {});
    return () => { mounted = false; };
  }, [i18n.language]);

  // Safely extract cabin code from various possible shapes without using `any`
  const getCabinCode = (sq: unknown): string | undefined => {
    if (!sq || typeof sq !== 'object') return undefined;
    const obj = sq as Record<string, unknown>;
    const options = obj.options;
    if (options && typeof options === 'object') {
      const opt = options as Record<string, unknown>;
      const cabin = opt.cabin;
      if (typeof cabin === 'string') return cabin;
    }
    return undefined;
  };

  // compute display strings so JSX stays simple and avoids `any`
  const baggageText = formatBaggage(
    flight.baggage_allowance || flight.legs[0]?.bags?.ADT?.checked?.desc || '',
    t
  ) || t('noBaggageIncluded', 'لا تشمل أمتعة');

  const cabinText = (() => {
    let code = getCabinCode(flight.search_query) || '';
    const f = flight as unknown as Record<string, unknown>;
    if (!code && typeof f.cabin === 'string') code = f.cabin as string;
    const map: Record<string, string> = {
      e: t('economy', 'Economy'),
      p: t('premiumEconomy', 'Premium Economy'),
      b: t('business', 'Business'),
      f: t('first', 'First')
    };
    return map[String(code)] || (code || t('n_a', 'N/A'));
  })();

  return (
    <div className="mt-6 pt-6 border-t">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Info className="h-5 w-5 text-tourtastic-blue" />
            {t('flightDetails', 'تفاصيل الرحلة')}
          </h3>
          <div className="flex flex-col gap-1">
            <div className="text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">{t('baggageAllowance', 'الأمتعة المسموح بها')}</span>
                <span className="font-medium">{baggageText}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-500">{t('cabinClass', 'Cabin Class')}</span>
                <span className="font-medium">{cabinText}</span>
              </div>
            </div>
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
                        {getLocalizedAirline(segment.airline_name, segment.airline_iata || segment.iata)}
                      </span>
                    </div>
                      <div className="text-sm text-gray-600">{(() => {
                          const totalMinutes = Math.max(0, segment.duration || 0);
                          const hours = Math.floor(totalMinutes / 60);
                          const minutes = totalMinutes % 60;
                          if (hours > 0) {
                            return `${hours} ${t('hour', { count: hours })} ${minutes} ${t('minute', { count: minutes })}`;
                          }
                          return `${minutes} ${t('minute', { count: minutes })}`;
                        })()}
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
                        <span className="text-gray-600">{airportsMap[segment.from.airport]?.name || segment.from.airport}</span>
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
                        <span className="text-gray-600">{airportsMap[segment.to.airport]?.name || segment.to.airport}</span>
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
              <span className="text-gray-500">{t('base', 'السعر الأساسي')}</span>
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