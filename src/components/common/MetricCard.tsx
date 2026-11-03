import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  variant?: 'emerald' | 'amber' | 'terracotta' | 'coffee';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  variant = 'coffee',
  className = '',
}) => {
  const borderStyles = {
    emerald: 'border-l-4 border-l-cordillera-700 hover:border-l-cordillera-600',
    amber: 'border-l-4 border-l-amber-600 hover:border-l-amber-500',
    terracotta: 'border-l-4 border-l-terracota-600 hover:border-l-terracota-500',
    coffee: 'border-l-4 border-l-cafe-800 hover:border-l-cafe-700',
  };

  const iconBgStyles = {
    emerald: 'bg-cordillera-50 text-cordillera-700',
    amber: 'bg-amber-50 text-amber-700',
    terracotta: 'bg-terracota-50 text-terracota-700',
    coffee: 'bg-cafe-100 text-cafe-800',
  };

  return (
    <div className={`bg-white rounded-xl p-5 border border-cafe-200/60 shadow-sm transition-all hover:shadow-md ${borderStyles[variant]} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-cafe-600">{title}</p>
          <div className="flex items-baseline space-x-2">
            <h4 className="text-2xl font-bold font-sans text-cafe-950">{value}</h4>
            {badge && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cafe-100 text-cafe-800">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-stone-500 font-sans">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`p-2.5 rounded-lg ${iconBgStyles[variant]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
