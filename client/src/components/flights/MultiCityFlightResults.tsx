import React, { useCallback } from 'react';
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

  const renderSearchSection = useCallback((section: SearchSection) => {
    const searchParam = section.searchParams[0];

    // Prefer city + country from first flight when available
    const firstFlight = section.flights[0];
    const fromCity = firstFlight?.legs?.[0]?.from?.city || '';
    const fromCountry = firstFlight?.legs?.[0]?.from?.country || firstFlight?.legs?.[0]?.from?.country_iso || '';
    const toCity = firstFlight?.legs?.[0]?.to?.city || '';
    const toCountry = firstFlight?.legs?.[0]?.to?.country || firstFlight?.legs?.[0]?.to?.country_iso || '';

    let headerFrom = fromCity && (fromCountry ? `${fromCity}, ${fromCountry}` : fromCity);
    let headerTo = toCity && (toCountry ? `${toCity}, ${toCountry}` : toCity);

    // If no flights yet, parse display strings
    if (!headerFrom) {
      headerFrom = extractCityCountry(searchParam.from) || searchParam.from;
    }
    if (!headerTo) {
      headerTo = extractCityCountry(searchParam.to) || searchParam.to;
    }

    return (
      <Card key={section.searchIndex} className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-tourtastic-blue" />
            <span className="text-lg font-semibold">
              {headerFrom} → {headerTo}
            </span>
            <span className="text-sm text-gray-500 ml-auto">
              {format(searchParam.date, 'MMM dd, yyyy')}
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
                      t('loadMoreFlights', 'Load More Flights')
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
  }, [selectedFlights, showDetails, onFlightSelection, onLoadMore, onAddToCart, t]);

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
