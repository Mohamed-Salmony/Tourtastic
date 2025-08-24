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
    'LH': '/Lufthansa-Logo.png'
  };
  
  const logoPath = logoMap[normalizedCode] || '/placeholder.svg';
  console.log(`Airline ${normalizedCode}: Found logo path: ${logoPath}`);
  
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