import React from 'react';
import PlaneAnimation from '@/components/ui/PlaneAnimation';
import { useTranslation } from 'react-i18next';

interface FlightSearchLoadingProps {
  progress?: number;
  message?: string;
  searchParams?: {
    from?: string;
    to?: string;
    date?: string;
  };
}

const FlightSearchLoading: React.FC<FlightSearchLoadingProps> = ({ 
  progress = 0, 
  message,
  searchParams 
}) => {
  const { t } = useTranslation();
  
  const loadingMessages = [
    'Searching for available flights...',
    'Checking airline schedules...',
    'Comparing prices...',
    'Finding the best deals...',
    'Almost there...'
  ];
  
  const getMessageByProgress = (prog: number) => {
    if (prog <= 20) return loadingMessages[0];
    if (prog <= 40) return loadingMessages[1];
    if (prog <= 60) return loadingMessages[2];
    if (prog <= 80) return loadingMessages[3];
    return loadingMessages[4];
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Plane Animation */}
      <div className="mb-8">
        <PlaneAnimation size="lg" />
      </div>

      {/* Search Info */}
      {searchParams && (searchParams.from || searchParams.to) && (
        <div className="text-center mb-6">
          <div className="text-lg font-medium text-gray-700">
            {searchParams.from && searchParams.to && (
              <span>
                {searchParams.from} 
                <span className="mx-2 text-tourtastic-blue">→</span>
                {searchParams.to}
              </span>
            )}
          </div>
          {searchParams.date && (
            <div className="text-sm text-gray-500 mt-1">
              {searchParams.date}
            </div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full max-w-md mb-4">
        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-tourtastic-blue to-blue-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-700">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Loading Message */}
      <div className="text-center">
        <p className="text-gray-600 animate-pulse">
          {message || t(getMessageByProgress(progress), getMessageByProgress(progress))}
        </p>
      </div>

      {/* Airlines Being Searched Animation */}
      <div className="mt-8 flex items-center gap-4 animate-fade-in">
        <div className="flex -space-x-2">
          {['/egyptair-logo.png', '/Emirates-Logo.png', '/Turkish-Airlines-Logo.png', '/Qatar Airways Logo.png'].map((logo, index) => (
            <div
              key={index}
              className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 p-1 animate-bounce"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <img src={logo} alt="Airline" className="w-full h-full object-contain" />
            </div>
          ))}
        </div>
        <span className="text-sm text-gray-500">
          {t('searchingMultipleAirlines', 'Searching multiple airlines...')}
        </span>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default FlightSearchLoading;
