import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, Search, Plus, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '@/config/api';
import { Airport } from '@/services/airportService';

const searchFormSchema = z.object({
  flightSegments: z.array(z.object({
    from: z.string().min(2, { message: 'Please enter departure city' }),
    to: z.string().min(2, { message: 'Please enter destination city' }),
    date: z.date({ required_error: 'Please select departure date' }),
  })),
  passengers: z.object({
    adults: z.number().min(1, { message: 'At least one adult is required' }),
    children: z.number().min(0),
    infants: z.number().min(0),
  }),
  cabin: z.enum(['e', 'p', 'b', 'f']).optional(),
  direct: z.boolean().optional(),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

const SearchForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [fromSuggestions, setFromSuggestions] = useState<Airport[]>([]);
  const [toSuggestions, setToSuggestions] = useState<Airport[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [fromDisplayValues, setFromDisplayValues] = useState<string[]>([]);
  const [toDisplayValues, setToDisplayValues] = useState<string[]>([]);
  const [datePickerOpen, setDatePickerOpen] = useState<boolean[]>([false]);
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, setValue, watch, trigger } = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      flightSegments: [{ from: '', to: '', date: undefined }],
      passengers: { adults: 1, children: 0, infants: 0 },
      cabin: 'e',
      direct: false,
    },
  });

  const flightSegments = watch('flightSegments');
  const passengers = watch('passengers');
  const cabin = watch('cabin');
  const direct = watch('direct');

  // Update datePickerOpen state when flightSegments change
  useEffect(() => {
    setDatePickerOpen(Array(flightSegments.length).fill(false));
  }, [flightSegments.length]);

  // Fetch airport suggestions from API (sync with flight page)
  const handleFromInputChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    setFromDisplayValues(values => {
      const newValues = [...values];
      newValues[index] = e.target.value;
      return newValues;
    });
    setValue(`flightSegments.${index}.from`, e.target.value);
    if (e.target.value.length > 0) {
      setShowFromSuggestions(true);
      try {
        const res = await api.get(`/airports/search?q=${encodeURIComponent(e.target.value)}`);
        setFromSuggestions(res.data.data);
      } catch {
        setFromSuggestions([]);
      }
    } else {
      setShowFromSuggestions(false);
      setFromSuggestions([]);
    }
  };

  const handleToInputChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    setToDisplayValues(values => {
      const newValues = [...values];
      newValues[index] = e.target.value;
      return newValues;
    });
    setValue(`flightSegments.${index}.to`, e.target.value);
    if (e.target.value.length > 0) {
      setShowToSuggestions(true);
      try {
        const res = await api.get(`/airports/search?q=${encodeURIComponent(e.target.value)}`);
        setToSuggestions(res.data.data);
      } catch {
        setToSuggestions([]);
      }
    } else {
      setShowToSuggestions(false);
      setToSuggestions([]);
    }
  };

  const handleFromSuggestionClick = (airport: Airport, index: number) => {
    setValue(`flightSegments.${index}.from`, airport.iata_code, { shouldValidate: true, shouldDirty: true });
    setFromDisplayValues(values => {
      const newValues = [...values];
      newValues[index] = `${airport.iata_code} - ${airport.name} (${airport.city}, ${airport.country})`;
      return newValues;
    });
    setShowFromSuggestions(false);
    trigger(`flightSegments.${index}.from`);
  };

  const handleToSuggestionClick = (airport: Airport, index: number) => {
    setValue(`flightSegments.${index}.to`, airport.iata_code, { shouldValidate: true, shouldDirty: true });
    setToDisplayValues(values => {
      const newValues = [...values];
      newValues[index] = `${airport.iata_code} - ${airport.name} (${airport.city}, ${airport.country})`;
      return newValues;
    });
    setShowToSuggestions(false);
    trigger(`flightSegments.${index}.to`);
  };

  const onSubmit = (data: SearchFormValues) => {
    navigate('/flights', {
      state: {
        flightSegments: data.flightSegments,
        passengers: data.passengers,
        cabin: data.cabin,
        direct: data.direct,
      },
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 lg:p-8 -mt-16 relative z-20 mx-auto max-w-6xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Flight Segments */}
        <div className="space-y-4">
          {flightSegments.map((segment, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label htmlFor={`from-${index}`}>{t('from', 'From')}</Label>
                <div className="relative">
                  <Input
                    id={`from-${index}`}
                    ref={fromInputRef}
                    placeholder={t('departureCity', 'Departure city')}
                    value={fromDisplayValues[index] ?? segment.from ?? ''}
                    onChange={e => handleFromInputChange(e, index)}
                    autoComplete="off"
                    onFocus={() => (segment.from ?? '').length > 0 && setShowFromSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowFromSuggestions(false), 100)}
                  />
                  {showFromSuggestions && fromSuggestions.length > 0 && (
                    <ul className="absolute z-10 bg-white border w-full max-h-48 overflow-y-auto shadow-lg rounded mt-1">
                      {fromSuggestions.map((a, i) => (
                        <li
                          key={`${a.code || 'unknown'}-${i}`}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onMouseDown={() => handleFromSuggestionClick(a, index)}
                        >
                          {a.code} - {a.name} ({a.city}, {a.country})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {errors.flightSegments?.[index]?.from && (
                  <p className="text-sm text-destructive">{errors.flightSegments[index]?.from?.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`to-${index}`}>{t('to', 'To')}</Label>
                <div className="relative">
                  <Input
                    id={`to-${index}`}
                    ref={toInputRef}
                    placeholder={t('destinationCity', 'Destination city')}
                    value={toDisplayValues[index] ?? segment.to ?? ''}
                    onChange={e => handleToInputChange(e, index)}
                    autoComplete="off"
                    onFocus={() => (segment.to ?? '').length > 0 && setShowToSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowToSuggestions(false), 100)}
                  />
                  {showToSuggestions && toSuggestions.length > 0 && (
                    <ul className="absolute z-10 bg-white border w-full max-h-48 overflow-y-auto shadow-lg rounded mt-1">
                      {toSuggestions.map((a, i) => (
                        <li
                          key={`${a.code || 'unknown'}-${i}`}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onMouseDown={() => handleToSuggestionClick(a, index)}
                        >
                          {a.code} - {a.name} ({a.city}, {a.country})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {errors.flightSegments?.[index]?.to && (
                  <p className="text-sm text-destructive">{errors.flightSegments[index]?.to?.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`date-${index}`}>{t('date', 'Date')}</Label>
                <Popover open={datePickerOpen[index]} onOpenChange={open => setDatePickerOpen(prev => {
                  const arr = [...prev];
                  arr[index] = open;
                  return arr;
                })}>
                  <PopoverTrigger asChild>
                    <Button
                      id={`date-${index}`}
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !segment.date && "text-muted-foreground"
                      )}
                      onClick={() => setDatePickerOpen(prev => {
                        const arr = [...prev];
                        arr[index] = true;
                        return arr;
                      })}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {segment.date ? (segment.date instanceof Date && !isNaN(segment.date.getTime()) ? format(segment.date, "PPP") : <span>{t('pickDate', 'Pick a date')}</span>) : <span>{t('pickDate', 'Pick a date')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 h-auto" align="start" side="bottom" sideOffset={4}>
                    <Calendar
                      mode="single"
                      selected={segment.date}
                      onSelect={(date) => {
                        setValue(`flightSegments.${index}.date`, date);
                        setDatePickerOpen(prev => {
                          const arr = [...prev];
                          arr[index] = false;
                          return arr;
                        });
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto min-h-[280px]")}
                      fixedWeeks
                    />
                  </PopoverContent>
                </Popover>
                {errors.flightSegments?.[index]?.date && (
                  <p className="text-sm text-destructive">{errors.flightSegments[index]?.date?.message}</p>
                )}
              </div>
            </div>
          ))}
          {flightSegments.length < 3 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setValue('flightSegments', [...flightSegments, { from: '', to: '', date: undefined }])}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" /> {t('addSearch', 'Add Search')}
            </Button>
          )}
        </div>

        {/* Passenger Selection */}
        <div className="p-4 border rounded-lg">
          <Label>{t('passengers', 'Passengers')}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                {`${passengers.adults} ${t('adults', 'Adults')}` +
                  (passengers.children ? `, ${passengers.children} ${t('children', 'Children')}` : '') +
                  (passengers.infants ? `, ${passengers.infants} ${t('infants', 'Infants')}` : '')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>{t('adults', 'Adults')}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('passengers.adults', Math.max(1, passengers.adults - 1))}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center">{passengers.adults}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('passengers.adults', passengers.adults + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('children', 'Children')}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('passengers.children', Math.max(0, passengers.children - 1))}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center">{passengers.children}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('passengers.children', passengers.children + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('infants', 'Infants')}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('passengers.infants', Math.max(0, passengers.infants - 1))}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center">{passengers.infants}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('passengers.infants', passengers.infants + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Cabin Class and Direct Flights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
          <div className="space-y-2">
            <Label>{t('cabinClass', 'Cabin Class')}</Label>
            <Select value={cabin} onValueChange={(value) => setValue('cabin', value as 'e' | 'p' | 'b' | 'f')}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectCabin', 'Select cabin class')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="e">{t('economy', 'Economy')}</SelectItem>
                <SelectItem value="p">{t('premiumEconomy', 'Premium Economy')}</SelectItem>
                <SelectItem value="b">{t('business', 'Business')}</SelectItem>
                <SelectItem value="f">{t('first', 'First')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('flightType', 'Flight Type')}</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={direct ? "default" : "outline"}
                onClick={() => setValue('direct', true)}
              >
                {t('directOnly', 'Direct Only')}
              </Button>
              <Button
                type="button"
                variant={!direct ? "default" : "outline"}
                onClick={() => setValue('direct', false)}
              >
                {t('allFlights', 'All Flights')}
              </Button>
            </div>
          </div>
        </div>

        {/* Search Button */}
        <Button type="submit" className="bg-tourtastic-blue hover:bg-tourtastic-dark-blue text-white w-full">
          <Search className="mr-2 h-4 w-4" /> {t('searchFlights', 'Search Flights')}
        </Button>
      </form>
    </div>
  );
};

export default SearchForm;
