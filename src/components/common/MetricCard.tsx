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
    emerald: 'border-l-4 border-l-cordillera-700 hover:border-l-cordillera-500',
    amber: 'border-l-4 border-l-amber-600 hover:border-l-amber-500',
    terracotta: 'border-l-4 border-l-terracota-600 hover:border-l-terracota-500',
    coffee: 'border-l-4 border-l-cafe-800 hover:border-l-cafe-600',
  };

  const iconBgStyles = {
    emerald: 'bg-cordillera-50 text-cordillera-700 border border-cordillera-200/60',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    terracotta: 'bg-terracota-50 text-terracota-700 border border-terracota-200/60',
    coffee: 'bg-cafe-100/80 text-cafe-800 border border-cafe-200',
  };

  const badgeStyles = {
    emerald: 'bg-cordillera-100 text-cordillera-800',
    amber: 'bg-amber-100 text-amber-800',
    terracotta: 'bg-terracota-100 text-terracota-800',
    coffee: 'bg-cafe-100 text-cafe-800',
  };

  return (
    <div
      className={`bg-white rounded-2xl p-4 sm:p-5 border border-cafe-200/80 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${borderStyles[variant]} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-cafe-600 truncate">
            {title}
          </p>
          <div className="flex items-baseline flex-wrap gap-2">
            <h4 className="text-xl sm:text-2xl font-bold font-mono text-cafe-950 tracking-tight">
              {value}
            </h4>
            {badge && (
              <span
                className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${badgeStyles[variant]}`}
              >
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-cafe-600 font-sans leading-snug">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={`p-2.5 rounded-xl shrink-0 ${iconBgStyles[variant]}`}>{icon}</div>
        )}
      </div>
    </div>
  );
};
