import React from 'react';
import { Plane } from 'lucide-react';

interface PlaneAnimationProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  progress?: number;
}

const PlaneAnimation: React.FC<PlaneAnimationProps> = ({ size = 'md', className = '', progress }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const progressWidth = progress ? `${progress}%` : '0%';

  return (
    <div className={`relative ${className}`}>
      {/* Progress Circle */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <svg className="transform -rotate-90 w-32 h-32">
            <circle
              cx="64"
              cy="64"
              r="30"
              stroke="#E5E7EB"
              strokeWidth="6"
              fill="none"
              className="opacity-25"
            />
            <circle
              cx="64"
              cy="64"
              r="30"
              stroke="#3B82F6"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              className="transition-all duration-500"
              strokeDasharray={`${progress ? (progress * 1.88) : 0}, 188.4`}
            />
          </svg>
          {progress && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-semibold text-blue-600">{Math.round(progress)}%</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Animated Plane */}
      <div className="relative z-10 flex items-center justify-center">
        <div className="animate-float">
          <Plane className={`${sizeClasses[size]} text-blue-600 transform rotate-45`} />
        </div>
      </div>
      
      {/* Takeoff/Landing Effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-75"></div>
      </div>
      
      {/* Custom CSS for plane movement */}
      <style>{`
        @keyframes planeMove {
          0% {
            transform: translateX(-50px) translateY(10px) rotate(45deg);
            opacity: 0.7;
          }
          50% {
            transform: translateX(0px) translateY(-5px) rotate(45deg);
            opacity: 1;
          }
          100% {
            transform: translateX(50px) translateY(10px) rotate(45deg);
            opacity: 0.7;
          }
        }
        
        .plane-moving {
          animation: planeMove 3s ease-in-out infinite;
        }
      `}</style>
      
      <div className="absolute inset-0 flex items-center justify-center">
        <Plane className={`${sizeClasses[size]} text-blue-600 plane-moving`} />
      </div>
    </div>
  );
};

export default PlaneAnimation;