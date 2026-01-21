// KPICard.jsx
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export const KPICard = ({ 
  title, 
  value, 
  unit, 
  status = 'normal', 
  icon, 
  trend, 
  className 
}) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 300);
    return () => clearTimeout(timer);
  }, [value]);

  const statusColors = {
    normal: 'text-status-normal',
    warning: 'text-status-warning',
    critical: 'text-status-critical',
  };

  const statusBgColors = {
    normal: 'bg-status-normal/10 border-status-normal/30',
    warning: 'bg-status-warning/10 border-status-warning/30',
    critical: 'bg-status-critical/10 border-status-critical/30',
  };

  return (
    <div className={cn(
      "industrial-card p-3 min-w-[130px] border",
      statusBgColors[status],
      className
    )}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground uppercase tracking-wider truncate">
          {title}
        </span>
        {icon && <span className={cn("opacity-70", statusColors[status])}>{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn(
          "text-xl font-bold font-mono tracking-tight transition-all",
          statusColors[status],
          animate && "animate-value-update"
        )}>
          {typeof value === 'number' 
            ? value.toFixed(value % 1 === 0 ? 0 : 1) 
            : value}
        </span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
        {trend && (
          <span className={cn(
            "text-xs ml-1",
            trend === 'up' ? 'text-status-warning' : 
            trend === 'down' ? 'text-status-normal' : 
            'text-muted-foreground'
          )}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
    </div>
  );
};