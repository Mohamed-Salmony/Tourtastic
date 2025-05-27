import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`flex items-center ${className}`}>
    <img 
      src="/Tourtastic-logo.png" 
      alt="Tourtastic Logo" 
      width={40} 
      height={40} 
      className="mr-2" 
      style={{ objectFit: 'contain' }}
    />
    <div className="flex flex-col">
      <span className="font-century-gothic font-bold text-xl tracking-wide">
        <span className="text-black">TOUR</span>
        <span className="text-tourtastic-blue">TASTIC</span>
      </span>
      <span className="text-xs tracking-widest text-gray-600">YOUR TOUR IS FANTASTIC</span>
    </div>
  </div>
);

export default Logo;
