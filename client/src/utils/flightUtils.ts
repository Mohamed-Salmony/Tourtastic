import { Flight } from '@/services/flightService';

// Helper function to calculate total price
export const calculateTotalPrice = (flight: Flight): number => {
  const adtTotal = (flight.search_query?.adt || 0) * ((flight.price_breakdowns?.ADT?.price || 0) + (flight.price_breakdowns?.ADT?.tax || 0));
  const chdTotal = (flight.search_query?.chd || 0) * ((flight.price_breakdowns?.CHD?.price || 0) + (flight.price_breakdowns?.CHD?.tax || 0));
  const infTotal = (flight.search_query?.inf || 0) * ((flight.price_breakdowns?.INF?.price || 0) + (flight.price_breakdowns?.INF?.tax || 0));
  return adtTotal + chdTotal + infTotal;
};

// Helper function for time of day filtering
export const getTimeOfDay = (dateStr: string): string => {
  const hour = new Date(dateStr).getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};