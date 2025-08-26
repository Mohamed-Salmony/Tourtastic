import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plane } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flight } from '@/services/flightService';
import FlightCard from './FlightCard';
import { format } from 'date-fns';
import FlightDetails from './FlightDetails';

interface SearchSection {
  searchIndex: number;
  searchParams: {
    from: string;
    to: string;
    date: Date;
  }[];
  flights: Flight[];
  isComplete: boolean;
  hasMore: boolean;
  loading: boolean;
  error?: string;
  visibleCount: number;
}

interface MultiCityFlightResultsProps {
  searchSections: SearchSection[];
  passengers: { adults: number; children: number; infants: number };
  onFlightSelection: (flight: Flight, searchIndex: number) => void;
  onLoadMore: (searchIndex: number) => void;
  onAddToCart: (flight: Flight) => void;
  selectedFlights: { [searchIndex: number]: Flight };
  showDetails: string | null;
}

function extractCityCountry(display: string): string | null {
  // Expected formats like: "DXB - Dubai International Airport (Dubai, AE)"
  const match = display.match(/\(([^)]+)\)/);
  if (match && match[1]) {
    return match[1]; // e.g., "Dubai, AE"
  }
  return null;
}

const MultiCityFlightResults: React.FC<MultiCityFlightResultsProps> = ({
  searchSections,
  passengers,
  onFlightSelection,
  onLoadMore,
  onAddToCart,
  selectedFlights,
  showDetails,
}) => {
  const { t } = useTranslation();

  const { i18n } = useTranslation();
  const [airportsMap, setAirportsMap] = useState<Record<string, import('@/services/airportService').Airport>>({});

  useEffect(() => {
    let mounted = true;
    const lang = i18n.language === 'ar' ? 'ar' : 'en';
    // lazy-import to avoid cycle if service isn't referenced elsewhere
    import('@/services/airportService').then(({ getAirportsMap }) => {
      getAirportsMap(lang).then(map => { if (mounted) setAirportsMap(map || {}); }).catch(() => {});
    }).catch(() => {});
    return () => { mounted = false; };
  }, [i18n.language]);

  const renderSearchSection = useCallback((section: SearchSection) => {
    const searchParam = section.searchParams[0];

    // Get city/country from the user's search param first (prefer exact intent),
    // then fall back to the first flight's leg data. This avoids showing a
    // connection city (e.g. Amman) when the user searched for Damascus.
    const firstFlight = section.flights[0];
    const leg = firstFlight?.legs?.[0];

    // Helper to extract IATA from strings like "DAM - Damascus International Airport (...)" or plain IATA
    const parseIata = (s?: string) => {
      if (!s) return '';
      const parts = s.split(' - ');
      const candidate = parts.length > 1 ? parts[0].trim() : s.trim();
      return /^[A-Z]{3}$/.test(candidate) ? candidate : '';
    };

    const searchFromIata = parseIata(searchParam.from as unknown as string);
    const searchToIata = parseIata(searchParam.to as unknown as string);

    const fromIata = searchFromIata || leg?.from?.iata || leg?.from?.iata_code || leg?.from?.iata_code || leg?.segments?.[0]?.from?.airport || '';
    // For destination prefer the leg.to iata or the last segment arrival (not the first segment arrival)
    const toIata = searchToIata || leg?.to?.iata || leg?.to?.iata_code || leg?.segments?.slice(-1)[0]?.to?.airport || '';

    const localizedFromCity = (fromIata && airportsMap[fromIata]?.municipality) || leg?.from?.city || '';
    const localizedFromCountry = (fromIata && airportsMap[fromIata]?.country) || leg?.from?.country || leg?.from?.country_iso || '';
    const localizedToCity = (toIata && airportsMap[toIata]?.municipality) || leg?.to?.city || '';
    const localizedToCountry = (toIata && airportsMap[toIata]?.country) || leg?.to?.country || leg?.to?.country_iso || '';

  // Use translation key `cityAndCountry` with interpolation and a sensible default fallback.
  let headerFrom = localizedFromCity && (localizedFromCountry
    ? t('cityAndCountry', { city: localizedFromCity, country: localizedFromCountry, defaultValue: `${localizedFromCity}, ${localizedFromCountry}` })
    : localizedFromCity
  );
  let headerTo = localizedToCity && (localizedToCountry
    ? t('cityAndCountry', { city: localizedToCity, country: localizedToCountry, defaultValue: `${localizedToCity}, ${localizedToCountry}` })
    : localizedToCity
  );

    // If no flights yet, parse display strings
    if (!headerFrom) {
      headerFrom = extractCityCountry(searchParam.from) || searchParam.from;
    }
    if (!headerTo) {
      headerTo = extractCityCountry(searchParam.to) || searchParam.to;
    }

      // use current language to determine arrow direction; this also ensures i18n.language is a used dependency
  const currentLang = i18n.language;
  // Arabic should point to the left (←), English to the right (→)
  const arrow = currentLang === 'ar' ? '←' : '→';

      return (
      <Card key={section.searchIndex} className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-tourtastic-blue" />
            <span className="text-lg font-semibold text-right">
                {`${headerFrom || ''} ${arrow} ${headerTo || ''}`}
            </span>
            <span className="text-sm text-gray-500 mr-auto">
              {new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-US' : 'en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(searchParam.date)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {section.loading && section.flights.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-tourtastic-blue"></div>
                <span className="text-gray-600">{t('searchingFlights', 'Searching for flights...')}</span>
              </div>
            </div>
          ) : section.flights.length > 0 ? (
            <>
              <div className="space-y-4">
                {section.flights.slice(0, section.visibleCount).map((flight) => (
                  <div key={flight.trip_id}>
                    <FlightCard
                      flight={flight}
                      onFlightSelection={() => onFlightSelection(flight, section.searchIndex)}
                      selectedFlight={selectedFlights[section.searchIndex]}
                      showDetails={showDetails}
                      onAddToCart={() => onAddToCart(flight)}
                    />
                    {showDetails === flight.trip_id && (
                      <FlightDetails flight={flight} onAddToCart={onAddToCart} />)
                    }
                  </div>
                ))}
              </div>

              {section.hasMore && (
                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    onClick={() => onLoadMore(section.searchIndex)}
                    disabled={section.loading}
                  >
                    {section.loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-tourtastic-blue"></div>
                        {t('loading', 'Loading...')}
                      </div>
                    ) : (
                      t('loadMoreFlights', 'Load more flights')
                    )}
                  </Button>
                </div>
              )}

              {!section.isComplete && (
                <div className="mt-4 text-center text-sm text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-tourtastic-blue"></div>
                    {t('searchingMoreFlights', 'Searching for more flights...')}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {section.error ? (
                <div className="text-center py-8">
                  <div className="text-red-500 mb-2">{t('searchError', 'Search Error')}</div>
                  <p className="text-gray-600">{section.error}</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Plane className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {t('noFlights', 'No flights found')}
                  </h4>
                  <p className="text-gray-500">
                    {t('noFlightsMessage', 'Try adjusting your search criteria or check back later')}
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  }, [airportsMap, i18n.language, t, selectedFlights, showDetails, onAddToCart, onFlightSelection, onLoadMore]);

  if (searchSections.length === 0) {
    return (
      <div className="text-center py-12">
        <Plane className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('noSearches', 'No searches performed')}
        </h3>
        <p className="text-gray-500">
          {t('startSearching', 'Start by adding flight searches above')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {searchSections.map(renderSearchSection)}
    </div>
  );
};

export { MultiCityFlightResults };
