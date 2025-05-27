
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

interface Destination {
  id: number;
  name: string;
  country: string;
  image: string;
  rating: number;
}

const Destinations: React.FC = () => {
  const { t } = useTranslation();
  
  const destinations: Destination[] = [
    {
      id: 1,
      name: 'Paris',
      country: 'France',
      image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=800&q=80',
      rating: 4.8
    },
    {
      id: 2,
      name: 'Bali',
      country: 'Indonesia',
      image: 'https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?auto=format&fit=crop&w=800&q=80',
      rating: 4.7
    },
    {
      id: 3,
      name: 'Tokyo',
      country: 'Japan',
      image: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=800&q=80',
      rating: 4.9
    },
    {
      id: 4,
      name: 'New York',
      country: 'USA',
      image: 'https://images.unsplash.com/photo-1485833077593-4278bba3f11f?auto=format&fit=crop&w=800&q=80',
      rating: 4.6
    }
  ];

  return (
    <section className="py-20">
      <div className="container-custom">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="section-title">{t('popularDestinations')}</h2>
            <p className="text-gray-600 max-w-2xl">
              {t('discoverMostSought')}
            </p>
          </div>
          <Link to="/destinations" className="text-tourtastic-blue hover:text-tourtastic-dark-blue transition-colors hidden md:block">
            {t('viewAllDestinations')}
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {destinations.map((destination) => (
            <div 
              key={destination.id} 
              className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 group"
            >
              <div className="relative h-60 overflow-hidden">
                <img 
                  src={destination.image} 
                  alt={destination.name} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-70"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold">{destination.name}</h3>
                  <p className="text-sm text-gray-200">{destination.country}</p>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <Star className="text-yellow-400 w-5 h-5 fill-current" />
                    <span className="ml-1 text-gray-700">{destination.rating}</span>
                  </div>
                  <span className="text-gray-600 text-sm">{t('excellent')}</span>
                </div>
                <Link 
                  to={`/destinations/${destination.id}`} 
                  className="block text-center py-2 border border-tourtastic-blue text-tourtastic-blue rounded hover:bg-tourtastic-blue hover:text-white transition-colors duration-300"
                >
                  {t('viewDetails')}
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center md:hidden">
          <Link to="/destinations" className="btn-primary">
            {t('viewAllDestinations')}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Destinations;
