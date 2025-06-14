import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, Search, Plus, Minus } from 'lucide-react';
import { useAuthenticatedAction } from '../../contexts/useAuthenticatedAction';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface FlightSegment {
  from: string;
  to: string;
  date: Date | undefined;
}

interface PassengerCount {
  adults: number;
  children: number;
  infants: number;
}

const SearchForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleAuthenticatedAction = useAuthenticatedAction();
  
  const [flightSegments, setFlightSegments] = useState<FlightSegment[]>([
    { from: '', to: '', date: undefined }
  ]);
  const [passengers, setPassengers] = useState<PassengerCount>({
    adults: 1,
    children: 0,
    infants: 0
  });

  const addFlightSegment = () => {
    if (flightSegments.length < 3) {
      setFlightSegments([...flightSegments, { from: '', to: '', date: undefined }]);
    }
  };

  const removeFlightSegment = (index: number) => {
    if (flightSegments.length > 1) {
      const newSegments = flightSegments.filter((_, i) => i !== index);
      setFlightSegments(newSegments);
    }
  };

  const updateFlightSegment = (index: number, field: keyof FlightSegment, value: string | Date | undefined) => {
    const newSegments = [...flightSegments];
    newSegments[index] = { ...newSegments[index], [field]: value };
    setFlightSegments(newSegments);
  };

  const updatePassengerCount = (type: keyof PassengerCount, action: 'increment' | 'decrement') => {
    setPassengers(prev => {
      const newCount = { ...prev };
      if (action === 'increment') {
        newCount[type]++;
      } else {
        newCount[type] = Math.max(0, newCount[type] - 1);
      }
      return newCount;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    handleAuthenticatedAction(() => {
      navigate('/flights', {
        state: {
          flightSegments,
          passengers
        }
      });
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 lg:p-8 -mt-16 relative z-20 mx-auto max-w-6xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Flight Segments */}
        <div className="space-y-4">
          {flightSegments.map((segment, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{t('flight')} {index + 1}</h3>
                {flightSegments.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFlightSegment(index)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor={`from-${index}`} className="mb-2 block">{t('from')}</Label>
                  <Input
                    id={`from-${index}`}
                    placeholder={t('cityOrAirport')}
                    value={segment.from}
                    onChange={(e) => updateFlightSegment(index, 'from', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`to-${index}`} className="mb-2 block">{t('to')}</Label>
                  <Input
                    id={`to-${index}`}
                    placeholder={t('cityOrAirport')}
                    value={segment.to}
                    onChange={(e) => updateFlightSegment(index, 'to', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`date-${index}`} className="mb-2 block">{t('date')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id={`date-${index}`}
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !segment.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {segment.date ? format(segment.date, "PPP") : <span>{t('pickDate')}</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50" align="start">
                      <Calendar
                        mode="single"
                        selected={segment.date}
                        onSelect={(date) => updateFlightSegment(index, 'date', date)}
                        initialFocus
                        disabled={(date) => date < new Date()}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </Card>
          ))}
          
          {flightSegments.length < 3 && (
            <Button
              type="button"
              variant="outline"
              onClick={addFlightSegment}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" /> {t('addFlight')}
            </Button>
          )}
        </div>

        {/* Passenger Selection */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">{t('passengers')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>{t('adults')}</Label>
                <p className="text-sm text-gray-500">{t('adultsDescription')}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updatePassengerCount('adults', 'decrement')}
                  disabled={passengers.adults <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center">{passengers.adults}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updatePassengerCount('adults', 'increment')}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>{t('children')}</Label>
                <p className="text-sm text-gray-500">{t('childrenDescription')}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updatePassengerCount('children', 'decrement')}
                  disabled={passengers.children <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center">{passengers.children}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updatePassengerCount('children', 'increment')}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>{t('infants')}</Label>
                <p className="text-sm text-gray-500">{t('infantsDescription')}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updatePassengerCount('infants', 'decrement')}
                  disabled={passengers.infants <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center">{passengers.infants}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updatePassengerCount('infants', 'increment')}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Search Button */}
        <Button type="submit" className="bg-tourtastic-blue hover:bg-tourtastic-dark-blue text-white w-full">
          <Search className="mr-2 h-4 w-4" /> {t('searchFlights')}
        </Button>
      </form>
    </div>
  );
};

export default SearchForm;
