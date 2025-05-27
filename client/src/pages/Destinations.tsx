import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Search, Star } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

// Mock destinations data
const mockDestinations = [
  {
    id: 'dest1',
    name: 'Paris',
    country: 'France',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=500',
    rating: 4.8,
    price: 1299,
    popular: true,
  },
  {
    id: 'dest2',
    name: 'Santorini',
    country: 'Greece',
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=500',
    rating: 4.9,
    price: 1499,
    popular: true,
  },
  {
    id: 'dest3',
    name: 'Bali',
    country: 'Indonesia',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=500',
    rating: 4.7,
    price: 1099,
    popular: true,
  },
  {
    id: 'dest4',
    name: 'Tokyo',
    country: 'Japan',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=500',
    rating: 4.6,
    price: 1599,
    popular: false,
  },
  {
    id: 'dest5',
    name: 'New York',
    country: 'USA',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=500',
    rating: 4.7,
    price: 1399,
    popular: true,
  },
  {
    id: 'dest6',
    name: 'Rome',
    country: 'Italy',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=500',
    rating: 4.6,
    price: 1199,
    popular: false,
  },
  {
    id: 'dest7',
    name: 'Sydney',
    country: 'Australia',
    image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=500',
    rating: 4.8,
    price: 1899,
    popular: true,
  },
  {
    id: 'dest8',
    name: 'Barcelona',
    country: 'Spain',
    image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=500',
    rating: 4.5,
    price: 1199,
    popular: false,
  },
];

const Destinations = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'popular');
  
  // Handle sort change
  const handleSortChange = (value: string) => {
    setSortBy(value);
    searchParams.set('sort', value);
    setSearchParams(searchParams);
  };
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      searchParams.set('search', searchTerm);
    } else {
      searchParams.delete('search');
    }
    setSearchParams(searchParams);
  };
  
  // Filter and sort destinations
  const filteredDestinations = mockDestinations.filter(destination => {
    if (!searchTerm) return true;
    return (
      destination.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      destination.country.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  const sortedDestinations = [...filteredDestinations].sort((a, b) => {
    if (sortBy === 'popular') {
      return a.popular === b.popular ? 0 : a.popular ? -1 : 1;
    } else if (sortBy === 'price-low') {
      return a.price - b.price;
    } else if (sortBy === 'price-high') {
      return b.price - a.price;
    } else if (sortBy === 'rating') {
      return b.rating - a.rating;
    }
    return 0;
  });
  
  return (
    <Layout>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 py-12">
        <div className="container-custom">
          <h1 className="text-4xl font-bold mb-4">{t('destinations', 'Destinations')}</h1>
          <p className="text-gray-600 max-w-2xl">
            Explore our collection of amazing destinations around the world. From iconic cities to 
            tranquil beaches, find your perfect getaway.
          </p>
        </div>
      </div>
      
      {/* Search and Filter Section */}
      <div className="bg-white py-6 shadow-sm border-b">
        <div className="container-custom">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <form onSubmit={handleSearch} className="relative w-full sm:max-w-md">
              <Input
                type="text"
                placeholder={t('searchDestinations', 'Search destinations...')}
                className="pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button 
                type="submit" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Search className="h-5 w-5" />
              </button>
            </form>
            
            <div className="flex items-center w-full sm:w-auto">
              <span className="mr-2 text-sm text-gray-500">{t('sortBy', 'Sort by:')}</span>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('sortByPlaceholder', 'Sort by')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">{t('mostPopular', 'Most Popular')}</SelectItem>
                  <SelectItem value="price-low">{t('priceLowHigh', 'Price: Low to High')}</SelectItem>
                  <SelectItem value="price-high">{t('priceHighLow', 'Price: High to Low')}</SelectItem>
                  <SelectItem value="rating">{t('topRated', 'Top Rated')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Destinations Grid */}
      <div className="py-12 container-custom">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedDestinations.length > 0 ? (
            sortedDestinations.map((destination) => (
              <Card key={destination.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={destination.image}
                    alt={destination.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                  {destination.popular && (
                    <div className="absolute top-2 right-2 bg-tourtastic-blue text-white text-xs px-2 py-1 rounded">
                      {t('popular', 'Popular')}
                    </div>
                  )}
                </div>
                <CardContent className="pt-6 pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{destination.name}</h3>
                      <p className="text-gray-500">{destination.country}</p>
                    </div>
                    <div className="flex items-center bg-tourtastic-light-blue px-2 py-1 rounded">
                      <Star className="h-4 w-4 text-tourtastic-blue mr-1 fill-current" />
                      <span className="text-sm font-medium">{destination.rating}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-lg font-bold text-tourtastic-blue">
                      {t('fromPrice', 'From $')}
                      {destination.price}
                    </p>
                    <p className="text-xs text-gray-500">{t('perPerson', 'per person')}</p>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 pb-6">
                  <Button className="w-full">{t('viewDetails', 'View Details')}</Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <h3 className="text-lg font-medium text-gray-600">{t('noDestinationsFound', 'No destinations found matching your search.')}</h3>
              <p className="mt-2 text-gray-500">{t('tryAdjusting', 'Try adjusting your search terms or browse all destinations.')}</p>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => {
                  setSearchTerm('');
                  searchParams.delete('search');
                  setSearchParams(searchParams);
                }}
              >
                {t('clearSearch', 'Clear Search')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Destinations;
