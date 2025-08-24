import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, Search, Plus, Minus, X } from 'lucide-react';
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
import useLocale from '@/hooks/useLocale';

const searchFormSchema = z.object({
  flightSegments: z.array(z.object({
    from: z.string().min(2, { message: 'Please enter departure city' }),
    to: z.string().min(2, { message: 'Please enter destination city' }),
    date: z.date({ required_error: 'Please select departure date' }),
  })).min(1, { message: 'At least one flight segment is required' })
    .max(3, { message: 'Maximum 3 flight segments allowed' })
    .superRefine((segments, ctx) => {
      // Validate date sequence for multi-city
      for (let i = 1; i < segments.length; i++) {
        if (segments[i-1].date >= segments[i].date) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Flight ${i + 1} date must be after flight ${i} date`,
            path: [i, 'date'],
          });
        }
      }
    }),
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
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [fromSuggestions, setFromSuggestions] = useState<Airport[]>([]);
  const [toSuggestions, setToSuggestions] = useState<Airport[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState<number | null>(null);
  const [showToSuggestions, setShowToSuggestions] = useState<number | null>(null);
  const [fromDisplayValues, setFromDisplayValues] = useState<string[]>(['']);
  const [toDisplayValues, setToDisplayValues] = useState<string[]>(['']);
  const [datePickerOpen, setDatePickerOpen] = useState<boolean[]>([false]);
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, setValue, watch, trigger, setError, clearErrors } = useForm<SearchFormValues>({
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
    setFromDisplayValues(prev => {
      const newValues = [...prev];
      while (newValues.length < flightSegments.length) {
        newValues.push('');
      }
      return newValues.slice(0, flightSegments.length);
    });
    setToDisplayValues(prev => {
      const newValues = [...prev];
      while (newValues.length < flightSegments.length) {
        newValues.push('');
      }
      return newValues.slice(0, flightSegments.length);
    });
  }, [flightSegments.length]);

  // Fetch airport suggestions from API
  const handleFromInputChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    setFromDisplayValues(values => {
      const newValues = [...values];
      newValues[index] = value;
      return newValues;
    });
    setValue(`flightSegments.${index}.from`, value);
    
    if (value.length >= 2) {
      setShowFromSuggestions(index);
      try {
        const response = await api.get(`/airports/search?q=${encodeURIComponent(value)}&lang=${i18n.language}`);
        if (response.data.success && response.data.data) {
          const airports = response.data.data;
          // Filter out any airports without proper translation data
          const validAirports = airports.filter(airport => 
            i18n.language === 'ar' ? 
              airport.name_arbic && airport.municipality_arbic && airport.country_arbic :
              airport.name && airport.municipality && airport.country
          );
          setFromSuggestions(validAirports);
        }
      } catch {
        setFromSuggestions([]);
      }
    } else {
      setShowFromSuggestions(null);
      setFromSuggestions([]);
    }
  };

  const handleToInputChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    setToDisplayValues(values => {
      const newValues = [...values];
      newValues[index] = value;
      return newValues;
    });
    setValue(`flightSegments.${index}.to`, value);
    
    if (value.length >= 2) {
      setShowToSuggestions(index);
      try {
        const response = await api.get(`/airports/search?q=${encodeURIComponent(value)}&lang=${i18n.language}`);
        if (response.data.success && response.data.data) {
          const airports = response.data.data;
          // Filter out any airports without proper translation data
          const validAirports = airports.filter(airport => 
            i18n.language === 'ar' ? 
              airport.name_arbic && airport.municipality_arbic && airport.country_arbic :
              airport.name && airport.municipality && airport.country
          );
          setToSuggestions(validAirports);
        }
      } catch {
        setToSuggestions([]);
      }
    } else {
      setShowToSuggestions(null);
      setToSuggestions([]);
    }
  };

  const handleFromSuggestionClick = (airport: Airport, index: number) => {
    setValue(`flightSegments.${index}.from`, airport.iata_code, { shouldValidate: true, shouldDirty: true });
    setFromDisplayValues(values => {
      const newValues = [...values];
      if (i18n.language === 'ar' && airport.name_arbic && airport.municipality_arbic && airport.country_arbic) {
        newValues[index] = `${airport.iata_code} - ${airport.name_arbic} (${airport.municipality_arbic}, ${airport.country_arbic})`;
      } else {
        newValues[index] = `${airport.iata_code} - ${airport.name} (${airport.municipality || airport.city}, ${airport.country || airport.iso_country})`;
      }
      return newValues;
    });
    setShowFromSuggestions(null);
    trigger(`flightSegments.${index}.from`);
  };

  const handleToSuggestionClick = (airport: Airport, index: number) => {
    setValue(`flightSegments.${index}.to`, airport.iata_code, { shouldValidate: true, shouldDirty: true });
    setToDisplayValues(values => {
      const newValues = [...values];
      if (i18n.language === 'ar' && airport.name_arbic && airport.municipality_arbic && airport.country_arbic) {
        newValues[index] = `${airport.iata_code} - ${airport.name_arbic} (${airport.municipality_arbic}, ${airport.country_arbic})`;
      } else {
        newValues[index] = `${airport.iata_code} - ${airport.name} (${airport.municipality || airport.city}, ${airport.country || airport.iso_country})`;
      }
      return newValues;
    });
    setShowToSuggestions(null);
    trigger(`flightSegments.${index}.to`);
  };

  const addFlightSegment = () => {
    if (flightSegments.length < 3) {
      setValue('flightSegments', [...flightSegments, { from: '', to: '', date: undefined }]);
    }
  };

  const removeFlightSegment = (index: number) => {
    if (flightSegments.length > 1) {
      const newSegments = flightSegments.filter((_, i) => i !== index);
      setValue('flightSegments', newSegments);
      
      // Clean up display values
      setFromDisplayValues(prev => prev.filter((_, i) => i !== index));
      setToDisplayValues(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Calculate min date for subsequent flights
  const getMinDateForSegment = (index: number) => {
    if (index === 0) {
      return new Date();
    }
    const previousDate = flightSegments[index - 1]?.date;
    if (previousDate && previousDate instanceof Date) {
      const nextDay = new Date(previousDate);
      nextDay.setDate(nextDay.getDate() + 1);
      return nextDay;
    }
    return new Date();
  };

  const onSubmit = (data: SearchFormValues) => {
    // Clear any previous errors
    clearErrors();
    
    navigate('/flights', {
      state: {
        flightSegments: data.flightSegments.map((segment, index) => ({
          ...segment,
          fromDisplayValue: fromDisplayValues[index] || segment.from,
          toDisplayValue: toDisplayValues[index] || segment.to,
        })),
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
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg relative">
              {/* Remove button for additional segments */}
              {flightSegments.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFlightSegment(index)}
                  className="absolute top-2 right-2 h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              
              <div className="space-y-2">
                <Label htmlFor={`from-${index}`}>{t('from', 'From')}</Label>
                <div className="relative">
                  <Input
                    id={`from-${index}`}
                    ref={fromInputRef}
                    placeholder={t('typeToSearch', 'Type 2-3 characters...')}
                    value={fromDisplayValues[index] || ''}
                    onChange={e => handleFromInputChange(e, index)}
                    autoComplete="off"
                    onFocus={() => {
                      if (fromDisplayValues[index]?.length >= 2) {
                        setShowFromSuggestions(index);
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowFromSuggestions(null), 150)}
                  />
                  {showFromSuggestions === index && fromSuggestions.length > 0 && (
                    <ul className="absolute z-50 bg-white border w-full max-h-48 overflow-y-auto shadow-lg rounded mt-1">
                      {fromSuggestions.map((a, i) => (
                        <li
                          key={`${a.iata_code || 'unknown'}-${i}`}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onMouseDown={() => handleFromSuggestionClick(a, index)}
                        >
                          <div className="font-medium">
                            {i18n.language === 'ar' 
                              ? `${a.iata_code} - ${a.name_arbic}` 
                              : `${a.iata_code} - ${a.name}`}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {i18n.language === 'ar'
                              ? `${a.municipality_arbic}, ${a.country_arbic}`
                              : `${a.municipality}, ${a.country}`}
                          </div>
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
                    placeholder={t('typeToSearch', 'Type 2-3 characters...')}
                    value={toDisplayValues[index] || ''}
                    onChange={e => handleToInputChange(e, index)}
                    autoComplete="off"
                    onFocus={() => {
                      if (toDisplayValues[index]?.length >= 2) {
                        setShowToSuggestions(index);
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowToSuggestions(null), 150)}
                  />
                  {showToSuggestions === index && toSuggestions.length > 0 && (
                    <ul className="absolute z-50 bg-white border w-full max-h-48 overflow-y-auto shadow-lg rounded mt-1">
                      {toSuggestions.map((a, i) => (
                        <li
                          key={`${a.iata_code || 'unknown'}-${i}`}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onMouseDown={() => handleToSuggestionClick(a, index)}
                        >
                          <div className="font-medium">
                            {i18n.language === 'ar' 
                              ? `${a.iata_code} - ${a.name_arbic}` 
                              : `${a.iata_code} - ${a.name}`}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {i18n.language === 'ar'
                              ? `${a.municipality_arbic}, ${a.country_arbic}`
                              : `${a.municipality}, ${a.country}`}
                          </div>
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
                <Label htmlFor={`date-${index}`}>
                  {t('date', 'Date')}
                  {index > 0 && (
                    <span className="text-xs text-gray-500 ml-1">
                      (after {flightSegments[index - 1]?.date ? format(flightSegments[index - 1].date, "MMM dd") : 'previous flight'})
                    </span>
                  )}
                </Label>
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
                        // Validate date sequence
                        trigger('flightSegments');
                      }}
                      disabled={(date) => date < getMinDateForSegment(index)}
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
          
          {/* Add Search Button */}
          {flightSegments.length < 3 && (
            <Button
              type="button"
              variant="outline"
              onClick={addFlightSegment}
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
