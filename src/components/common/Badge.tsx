import React from 'react';
import { PlaceCategory } from '../../types';

interface BadgeProps {
  category?: PlaceCategory;
  variant?: 'emerald' | 'amber' | 'terracotta' | 'coffee' | 'neutral';
  children?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ category, variant, children, className = '' }) => {
  if (category) {
    switch (category) {
      case 'CABECERA_MUNICIPAL':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cordillera-100 text-cordillera-800 border border-cordillera-600/20 ${className}`}>
            Cabecera Municipal
          </span>
        );
      case 'ATRACTIVO_TURISTICO':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-600/20 ${className}`}>
            Atractivo Turístico
          </span>
        );
      case 'FINCA_HOTEL':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cafe-100 text-cafe-800 border border-cafe-600/20 ${className}`}>
            Finca / Hotel Rural
          </span>
        );
      case 'CENTRO_ACOPIO':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-terracota-100 text-terracota-800 border border-terracota-600/20 ${className}`}>
            Centro de Acopio
          </span>
        );
    }
  }

  const variantStyles = {
    emerald: 'bg-cordillera-100 text-cordillera-800 border border-cordillera-600/20',
    amber: 'bg-amber-100 text-amber-800 border border-amber-600/20',
    terracotta: 'bg-terracota-100 text-terracota-800 border border-terracota-600/20',
    coffee: 'bg-cafe-100 text-cafe-800 border border-cafe-600/20',
    neutral: 'bg-stone-100 text-stone-700 border border-stone-300',
  };

  const style = variant ? variantStyles[variant] : variantStyles.neutral;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style} ${className}`}>
      {children}
    </span>
  );
};
