import React from 'react';
import { Sprout } from 'lucide-react';

interface LeafLogoProps {
  size?: 'sm' | 'md' | 'lg';
  whiteText?: boolean;
}

export const LeafLogo: React.FC<LeafLogoProps> = ({ size = 'md', whiteText = false }) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className="flex items-center gap-2 select-none">
      <div className="relative flex items-center justify-center p-2 rounded-2xl bg-emerald-600 shadow-sm text-white transition hover:scale-105">
        <Sprout className={iconSizes[size]} />
      </div>
      <div className="flex flex-col">
        <span className={`font-extrabold tracking-tight ${textSizes[size]} ${whiteText ? 'text-white' : 'text-emerald-950'}`}>
          Farm<span className="text-emerald-600">2</span>Home
        </span>
        <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-700">
          Fresh From Soil
        </span>
      </div>
    </div>
  );
};
