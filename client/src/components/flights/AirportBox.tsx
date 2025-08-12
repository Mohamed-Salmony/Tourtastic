import React from 'react';
import { MapPin, Plane, Globe, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface AirportBoxProps {
  airport: string;
  city: string;
  country?: string;
  terminal?: string;
  date: string;
  type: 'departure' | 'arrival';
  className?: string;
  time?: string;
}

const AirportBox: React.FC<AirportBoxProps> = ({
  airport,
  city,
  country,
  terminal,
  date,
  type,
  className = '',
  time
}) => {
  const bgColor = type === 'departure' ? 'bg-gradient-to-br from-blue-50 to-indigo-50' : 'bg-gradient-to-br from-green-50 to-emerald-50';
  const borderColor = type === 'departure' ? 'border-blue-200' : 'border-green-200';
  const iconColor = type === 'departure' ? 'text-blue-600' : 'text-green-600';
  const headerBg = type === 'departure' ? 'bg-blue-100' : 'bg-green-100';
  const headerText = type === 'departure' ? 'text-blue-800' : 'text-green-800';

  return (
    <div className={`relative rounded-lg border-2 ${borderColor} ${bgColor} p-4 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 ${className}`}>
      {/* Header */}
      <div className={`absolute -top-3 left-4 px-3 py-1 rounded-full ${headerBg} ${headerText} text-xs font-semibold uppercase tracking-wide`}>
        {type === 'departure' ? 'Departure' : 'Arrival'}
      </div>

      {/* Airport Code - Large and Prominent */}
      <div className="text-center mb-3 mt-2">
        <div className={`text-3xl font-bold ${iconColor} tracking-wide`}>
          {airport}
        </div>
        {terminal && (
          <div className="text-xs text-gray-500 mt-1">
            Terminal {terminal}
          </div>
        )}
      </div>

      {/* City and Country */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MapPin className={`h-4 w-4 ${iconColor}`} />
          <div className="flex-1">
            <div className="font-medium text-gray-800 text-sm">
              {city}
            </div>
            {country && (
              <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <Globe className="h-3 w-3" />
                {country}
              </div>
            )}
          </div>
        </div>

        {/* Date and Time */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
          <Clock className={`h-4 w-4 ${iconColor}`} />
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-800">
              {time || format(new Date(date), 'HH:mm')}
            </div>
            <div className="text-xs text-gray-500">
              {format(new Date(date), 'EEE, MMM dd, yyyy')}
            </div>
          </div>
        </div>
      </div>

      {/* Icon */}
      <div className="absolute -bottom-2 -right-2">
        <div className={`${headerBg} rounded-full p-2`}>
          <Plane className={`h-5 w-5 ${iconColor} ${type === 'departure' ? 'rotate-45' : '-rotate-45'}`} />
        </div>
      </div>
    </div>
  );
};

export default AirportBox;
