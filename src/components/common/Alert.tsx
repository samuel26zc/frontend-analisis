import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface AlertProps {
  type?: 'info' | 'warning' | 'success' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ type = 'info', title, children, className = '' }) => {
  const styles = {
    info: {
      container: 'bg-cafe-50 border-cafe-300 text-cafe-900',
      icon: <Info className="w-5 h-5 text-cafe-700 flex-shrink-0" />,
      titleColor: 'text-cafe-900',
    },
    warning: {
      container: 'bg-amber-50/80 border-amber-300 text-amber-900',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
      titleColor: 'text-amber-900',
    },
    success: {
      container: 'bg-cordillera-50/80 border-cordillera-300 text-cordillera-900',
      icon: <CheckCircle className="w-5 h-5 text-cordillera-700 flex-shrink-0" />,
      titleColor: 'text-cordillera-900',
    },
    error: {
      container: 'bg-terracota-50/80 border-terracota-300 text-terracota-900',
      icon: <AlertCircle className="w-5 h-5 text-terracota-700 flex-shrink-0" />,
      titleColor: 'text-terracota-900',
    },
  };

  const current = styles[type];

  return (
    <div className={`p-4 rounded-xl border text-sm flex gap-3 ${current.container} ${className}`}>
      {current.icon}
      <div className="space-y-1">
        {title && <h5 className={`font-semibold ${current.titleColor}`}>{title}</h5>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
};
