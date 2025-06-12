import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Search, Star, Heart, Loader2 } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { Destination, getAllDestinations } from '@/services/destinationService';
import { wishlistService } from '@/services/wishlistService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Destinations = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'popular');
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loadingDestinations, setLoadingDestinations] = useState(true);
  const [errorDestinations, setErrorDestinations] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllDestinations();
        setDestinations(data);

        // Fetch user's wishlist if logged in
        if (user) {
          const wishlistData = await wishlistService.getWishlist(user._id);
          setWishlist(wishlistData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setErrorDestinations("Failed to load destinations. Please try again later.");
      } finally {
        setLoadingDestinations(false);
      }
    };
    fetchData();
  }, [user]);

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

  const handleWishlistToggle = async (destinationId: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when clicking the heart icon
    e.stopPropagation(); // Prevent event bubbling

    if (!user) {
      toast.error('Please log in to add destinations to your wishlist');
      return;
    }

    try {
      if (wishlist.includes(destinationId)) {
        await wishlistService.removeFromWishlist(user._id, destinationId);
        setWishlist(wishlist.filter(id => id !== destinationId));
        toast.success('Removed from wishlist');
      } else {
        await wishlistService.addToWishlist(user._id, destinationId);
        setWishlist([...wishlist, destinationId]);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error('Failed to update wishlist');
    }
  };

  // Filter destinations based on search term
  const filteredDestinations = destinations.filter(destination => {
    if (!searchTerm) return true;
    return (
      destination.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      destination.country.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Sort destinations based on selected criteria
  const sortedDestinations = [...filteredDestinations].sort((a, b) => {
    if (sortBy === 'popular') {
      return a.popular === b.popular ? 0 : a.popular ? -1 : 1;
    } else if (sortBy === 'rating') {
      return b.rating - a.rating;
    }
    return 0;
  });

  // Handle destination click to navigate to details page
  const handleDestinationClick = (destinationId: string) => {
    navigate(`/destinations/${destinationId}`);
  };

  if (loadingDestinations) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading destinations...</p>
        </div>
      </section>
    );
  }

  if (errorDestinations) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 text-center text-red-600">
          <p className="text-lg">Error: {errorDestinations}</p>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8">{t('destinations', 'Destinations')}</h1>
          
          {/* Search and Sort */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Input
                  type="text"
                  placeholder={t('searchDestinations', 'Search destinations...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </form>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={t('sortBy', 'Sort by')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">{t('popular', 'Popular')}</SelectItem>
                <SelectItem value="rating">{t('rating', 'Rating')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Destinations Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {sortedDestinations.map(destination => (
              <div key={destination._id} onClick={() => handleDestinationClick(destination._id)} className="cursor-pointer">
                <Card className="transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  <CardHeader className="p-0 relative group">
                    <img 
                      src={destination.image} 
                      alt={destination.name} 
                      className="w-full h-48 object-cover rounded-t-md transition-transform duration-300 group-hover:scale-110" 
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-md text-sm flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                      <span>{destination.rating.toFixed(1)}</span>
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-t-md"></div>
                  </CardHeader>
                  <CardContent className="p-4 text-center">
                    <h2 className="text-xl font-bold mb-2">{destination.name}</h2>
                    <p className="text-gray-600 dark:text-gray-400">{destination.country}</p>
                    <button
                      onClick={(e) => handleWishlistToggle(destination._id, e)}
                      className="mt-4 w-full bg-primary-50 hover:bg-primary-100 text-primary-600 py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                    >
                      <Heart 
                        className={`w-5 h-5 ${wishlist.includes(destination._id) ? 'text-red-500 fill-current' : 'text-primary-600'}`} 
                      />
                      <span>{wishlist.includes(destination._id) ? 'Remove from Wishlist' : 'Add to Wishlist'}</span>
                    </button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Destinations;
