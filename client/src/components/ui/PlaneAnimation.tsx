import React from 'react';
import { Plane } from 'lucide-react';

interface PlaneAnimationProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PlaneAnimation: React.FC<PlaneAnimationProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`relative ${className}`}>
      {/* Runway/Path */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-32 h-0.5 bg-gray-300 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"></div>
        </div>
      </div>
      
      {/* Animated Plane */}
      <div className="relative z-10 flex items-center justify-center">
        <div className="animate-bounce">
          <Plane className={`${sizeClasses[size]} text-blue-600 transform rotate-45 animate-pulse`} />
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