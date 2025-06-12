import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, Search } from 'lucide-react';
import { useAuthenticatedAction } from '../../contexts/useAuthenticatedAction';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SearchForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleAuthenticatedAction = useAuthenticatedAction();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [passengers, setPassengers] = useState('1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Navigate to flights page with search params using authenticated action
    handleAuthenticatedAction(() => {
      navigate('/flights', {
        state: {
          from,
          to,
          departureDate,
          returnDate,
          passengers
        }
      });
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 lg:p-8 -mt-16 relative z-20 mx-auto max-w-6xl">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* From */}
        <div>
          <Label htmlFor="from" className="mb-2 block">{t('from')}</Label>
          <Input
            id="from"
            placeholder={t('cityOrAirport')}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full"
            required
          />
        </div>

        {/* To */}
        <div>
          <Label htmlFor="to" className="mb-2 block">{t('to')}</Label>
          <Input
            id="to"
            placeholder={t('cityOrAirport')}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full"
            required
          />
        </div>

        {/* Departure Date */}
        <div>
          <Label htmlFor="departure" className="mb-2 block">{t('departure')}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="departure"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !departureDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {departureDate ? format(departureDate, "PPP") : <span>{t('pickDate')}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="start">
              <Calendar
                mode="single"
                selected={departureDate}
                onSelect={setDepartureDate}
                initialFocus
                disabled={(date) => date < new Date()}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Return Date */}
        <div>
          <Label htmlFor="return" className="mb-2 block">{t('return')}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="return"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !returnDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {returnDate ? format(returnDate, "PPP") : <span>{t('pickDate')}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="start">
              <Calendar
                mode="single"
                selected={returnDate}
                onSelect={setReturnDate}
                initialFocus
                disabled={(date) => date < (departureDate || new Date())}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Passengers + Search Button */}
        <div className="grid grid-cols-1 gap-2">
          <div>
            <Label htmlFor="passengers" className="mb-2 block">{t('passengers')}</Label>
            <Select value={passengers} onValueChange={setPassengers}>
              <SelectTrigger id="passengers">
                <SelectValue placeholder={t('selectPassengers')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 {t('passenger')}</SelectItem>
                <SelectItem value="2">2 {t('passengers_plural')}</SelectItem>
                <SelectItem value="3">3 {t('passengers_plural')}</SelectItem>
                <SelectItem value="4">4 {t('passengers_plural')}</SelectItem>
                <SelectItem value="5">5+ {t('passengers_plural')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="bg-tourtastic-blue hover:bg-tourtastic-dark-blue text-white w-full h-10 mt-2">
            <Search className="mr-2 h-4 w-4" /> {t('searchFlights')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SearchForm;
