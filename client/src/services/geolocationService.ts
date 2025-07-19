import api from '@/config/api';

export interface CountryInfo {
  country: string;
  countryCode: string;
  city: string;
  region: string;
}

// Country to capital airport mapping
const COUNTRY_CAPITAL_AIRPORTS: Record<string, string> = {
  'EG': 'CAI', // Egypt - Cairo International
  'US': 'JFK', // United States - John F. Kennedy (or could use DCA/IAD)
  'GB': 'LHR', // United Kingdom - Heathrow
  'FR': 'CDG', // France - Charles de Gaulle
  'DE': 'FRA', // Germany - Frankfurt
  'IT': 'FCO', // Italy - Rome Fiumicino
  'ES': 'MAD', // Spain - Madrid
  'NL': 'AMS', // Netherlands - Amsterdam
  'BE': 'BRU', // Belgium - Brussels
  'CH': 'ZUR', // Switzerland - Zurich
  'AT': 'VIE', // Austria - Vienna
  'SE': 'ARN', // Sweden - Stockholm
  'NO': 'OSL', // Norway - Oslo
  'DK': 'CPH', // Denmark - Copenhagen
  'FI': 'HEL', // Finland - Helsinki
  'RU': 'SVO', // Russia - Moscow Sheremetyevo
  'CN': 'PEK', // China - Beijing Capital
  'JP': 'NRT', // Japan - Tokyo Narita
  'KR': 'ICN', // South Korea - Seoul Incheon
  'IN': 'DEL', // India - Delhi
  'AU': 'SYD', // Australia - Sydney
  'CA': 'YYZ', // Canada - Toronto Pearson
  'BR': 'GRU', // Brazil - São Paulo
  'MX': 'MEX', // Mexico - Mexico City
  'AR': 'EZE', // Argentina - Buenos Aires
  'CL': 'SCL', // Chile - Santiago
  'PE': 'LIM', // Peru - Lima
  'CO': 'BOG', // Colombia - Bogotá
  'VE': 'CCS', // Venezuela - Caracas
  'ZA': 'JNB', // South Africa - Johannesburg
  'NG': 'LOS', // Nigeria - Lagos
  'KE': 'NBO', // Kenya - Nairobi
  'MA': 'CMN', // Morocco - Casablanca
  'TN': 'TUN', // Tunisia - Tunis
  'DZ': 'ALG', // Algeria - Algiers
  'LY': 'TIP', // Libya - Tripoli
  'SD': 'KRT', // Sudan - Khartoum
  'SA': 'RUH', // Saudi Arabia - Riyadh
  'AE': 'DXB', // UAE - Dubai
  'QA': 'DOH', // Qatar - Doha
  'KW': 'KWI', // Kuwait - Kuwait City
  'BH': 'BAH', // Bahrain - Bahrain
  'OM': 'MCT', // Oman - Muscat
  'JO': 'AMM', // Jordan - Amman
  'LB': 'BEY', // Lebanon - Beirut
  'SY': 'DAM', // Syria - Damascus
  'IQ': 'BGW', // Iraq - Baghdad
  'IR': 'IKA', // Iran - Tehran
  'TR': 'IST', // Turkey - Istanbul
  'GR': 'ATH', // Greece - Athens
  'CY': 'LCA', // Cyprus - Larnaca
  'IL': 'TLV', // Israel - Tel Aviv
  'TH': 'BKK', // Thailand - Bangkok
  'MY': 'KUL', // Malaysia - Kuala Lumpur
  'SG': 'SIN', // Singapore - Singapore
  'ID': 'CGK', // Indonesia - Jakarta
  'PH': 'MNL', // Philippines - Manila
  'VN': 'SGN', // Vietnam - Ho Chi Minh City
  'KH': 'PNH', // Cambodia - Phnom Penh
  'LA': 'VTE', // Laos - Vientiane
  'MM': 'RGN', // Myanmar - Yangon
  'BD': 'DAC', // Bangladesh - Dhaka
  'LK': 'CMB', // Sri Lanka - Colombo
  'NP': 'KTM', // Nepal - Kathmandu
  'PK': 'KHI', // Pakistan - Karachi
  'AF': 'KBL', // Afghanistan - Kabul
  'UZ': 'TAS', // Uzbekistan - Tashkent
  'KZ': 'ALA', // Kazakhstan - Almaty
  'KG': 'FRU', // Kyrgyzstan - Bishkek
  'TJ': 'DYU', // Tajikistan - Dushanbe
  'TM': 'ASB', // Turkmenistan - Ashgabat
};

// Reverse geocoding using a free service
export const getCountryFromCoordinates = async (latitude: number, longitude: number): Promise<CountryInfo> => {
  try {
    // Using OpenStreetMap Nominatim (free reverse geocoding)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=3&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Tourtastic-App/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch location data');
    }
    
    const data = await response.json();
    
    if (!data.address) {
      throw new Error('No address data found');
    }
    
    const countryCode = data.address.country_code?.toUpperCase() || '';
    const country = data.address.country || '';
    const city = data.address.city || data.address.town || data.address.village || '';
    const region = data.address.state || data.address.region || '';
    
    return {
      country,
      countryCode,
      city,
      region
    };
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    throw new Error('Failed to determine country from coordinates');
  }
};

// Get capital airport for a country
export const getCapitalAirportForCountry = (countryCode: string): string | null => {
  return COUNTRY_CAPITAL_AIRPORTS[countryCode.toUpperCase()] || null;
};

// Combined function to get capital airport from coordinates
export const getCapitalAirportFromCoordinates = async (latitude: number, longitude: number): Promise<string | null> => {
  try {
    const countryInfo = await getCountryFromCoordinates(latitude, longitude);
    return getCapitalAirportForCountry(countryInfo.countryCode);
  } catch (error) {
    console.error('Error getting capital airport from coordinates:', error);
    return null;
  }
};