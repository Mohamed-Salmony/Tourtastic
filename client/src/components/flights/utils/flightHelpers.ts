// Helper function to get airline logo
export const getAirlineLogo = (airlineCode: string) => {
  if (!airlineCode) return '/placeholder.svg';
  
  // Normalize airline code to uppercase
  const normalizedCode = airlineCode.trim().toUpperCase();
  
  const logoMap: { [key: string]: string } = {
    'TK': '/Turkish-Airlines-Logo.png',
    'EK': '/Emirates-Logo.png',
    'QR': '/Qatar Airways Logo.png',
    'MS': '/egyptair-logo.png',
    'SV': '/Saudi-Arabian-Airlines-Logo.png',
    'RJ': '/Royal-Jordanian-logo.png',
    'ME': '/Middle-East-Airlines-Logo.png',
    'GF': '/Gulf-Air-logo.png',
    'KU': '/Kuwait-Airways-logo.png',
    'WY': '/Oman-Air-Logo.png',
    'EY': '/Etihad-Airways-Logo.png',
    'FZ': '/FlyDubai-Logo.png',
    'XY': '/Flynas-Logo.png',
    'PC': '/Pegasus-Airlines-Logo.png',
    'HU': '/Hainan-Airlines-Logo.png',
    'MU': '/China-Eastern-Airlines-Logo.png',
    'SQ': '/Singapore-Airlines-Logo.png',
    'OS': '/Austrian-Airlines-Logo.png',
    'CA': '/Air-China-Logo.png',
    'I2': '/Iberia-Express-Logo.png',
    'LX': '/Swiss-International-Air-Lines-Logo.png',
    'AF': '/Air-France-Logo.png',
    'XQ': '/SunExpress-Logo.png',
    'VF': '/AJet-logo.png',
    'A3': '/Aegean-Airlines-logo.png',
    'AZ': '/ITA-Airways-Logo.png',
    'ET': '/Ethiopian-Airlines-Logo.png',
    'KQ': '/Kenya-Airways-Logo.png',
    'MH': '/Malaysia-Airlines-Logo.png',
    'JL': '/Japan-Airlines-Logo.png',
    'PK': '/Pakistan-International-Airlines-Logo.png',
    'AH': '/Air-Algerie-Logo.png',
    'AI': '/Air-India-Logo.png',
    'TU': '/Tunisair-logo.png',
    'NP': '/Nile-air-logo.png',
    '3U': '/Sichuan-Airlines-Logo.png',
    'AMF': '/Ameriflight-Logo.png',
    'HR': '/Hahn-Air-Logo.png',
    'NE': '/Nemsa-Airlines-Logo.png',
    'SM': '/Air-Cairo-Logo.png',
    'G9': '/Air-Arabia-Logo.png',
    'F3': '/Flyadeal-Logo.svg',
    'E5': '/Air-Arabia-Egypt-Logo.png',
    'J9': '/Jazeera-Airways-Logo.png',
    'R5': '/Royal-Jordanian-logo.png', // Same as RJ
    'BA': '/British-Airways-Logo.png',
    'LH': '/Lufthansa-Logo.png',
    'AT': '/Royal-Air-Maroc-Logo.png',
    '6E': '/IndiGo-Logo.png',
    '9P': '/Fly_Jinnah_logo.png',
    'BS': '/US-Bangla-Airlines-Logo.png',
    'IX': '/Air-India-Express-Logo.png',
    'J2': '/Azerbaijan-Airlines-Logo.png',
    'OV': '/Salam_Air_Logo.png',
    'VY': '/vueling.png'
  };

  // Added mappings for newly introduced IATA codes
  // Note: Eurowings logo file not found in /public; using Germanwings as a temporary fallback until the real logo is added.
  logoMap['EW'] = '/Germanwings-Logo.png';
  logoMap['KL'] = '/Royal-Dutch-Airlines-Logo.png';
  logoMap['LO'] = '/Polish-Airlines-Logo.png';
  logoMap['TO'] = '/Transavia-Logo.png';
  logoMap['TU'] = '/Tunisair-logo.png';
  // Vueling Airlines (IATA: VY)
  logoMap['VY'] = '/vueling.png';

  const logoPath = logoMap[normalizedCode] || '/placeholder.svg';
  
  return logoPath;
};

// Helper function to get time of day
export const getTimeOfDay = (dateString: string) => {
  const hour = new Date(dateString).getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

// Helper function to get time of day icon
export const getTimeOfDayIcon = (dateString: string) => {
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
export const getTimeOfDayWithColor = (dateString: string) => {
  const timeOfDay = getTimeOfDay(dateString);
  switch (timeOfDay) {
    case 'morning': return { text: 'صباحاً', color: 'text-orange-500' };
    case 'afternoon': return { text: 'ظهراً', color: 'text-yellow-500' };
    case 'evening': return { text: 'مساءً', color: 'text-purple-500' };
    case 'night': return { text: 'ليلاً', color: 'text-blue-500' };
    default: return { text: 'يوماً', color: 'text-gray-500' };
  }
};

// Format a baggage description like "2 pieces (23kg each)" into localized text
import type { TFunction } from 'i18next';

export const formatBaggage = (baggageStr: string | undefined | null, t: TFunction) => {
  // Treat falsy or explicit "no baggage" indicators as no baggage
  if (!baggageStr) return t('noBaggageIncluded', 'No baggage included');
  const lower = String(baggageStr).trim().toLowerCase();
  if (lower === 'no baggage included' || lower === 'no baggage' || lower === 'none') {
    return t('noBaggageIncluded', 'No baggage included');
  }

  // Try to parse common patterns like "1 piece (23kg)" or "2 pieces (23kg each)"
  const parsed = String(baggageStr).replace(/(\d+)\s*piece(?:s)?\s*\((\d+)kg(?:\s*each)?\)/i, (_match, pieces, weight) => {
    const count = Number(pieces);
    const pieceLabel = count === 1 ? t('baggageDetails.piece', 'قطعة') : t('baggageDetails.pieces', 'قطع');
    const kgLabel = t('baggageDetails.kg', 'كجم');
    return `${pieces} ${pieceLabel} (${weight} ${kgLabel})`;
  });

  const cleaned = parsed.trim();
  if (!cleaned) return t('noBaggageIncluded', 'No baggage included');
  return cleaned;
};