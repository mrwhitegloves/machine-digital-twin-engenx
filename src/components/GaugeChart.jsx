// GaugeChart.jsx
import { useState } from 'react';
import { cn } from "@/lib/utils";

const ARC_ANGLE = 140; // degrees (try 120–160)
const START_ANGLE = -90 - ARC_ANGLE / 2;

export const GaugeChart = ({ 
  value, 
  maxValue = 100, 
  title, 
  unit = '%',
  size = 'md',
  className 
}) => {
  const percentage = Math.min(100, (value / maxValue) * 100);
  const rotation = (percentage / 100) * 180 - 90;
  
  const getColor = () => {
    if (percentage < 33) return { stroke: 'hsl(142, 76%, 45%)', text: 'text-status-normal' };
    if (percentage < 66) return { stroke: 'hsl(45, 93%, 55%)', text: 'text-status-warning' };
    return { stroke: 'hsl(0, 72%, 51%)', text: 'text-status-critical' };
  };

  const { stroke, text } = getColor();

  const polarToCartesian = (cx, cy, r, angle) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const describeArc = (cx, cy, r, startAngle, endAngle) => {
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return `
      M ${start.x} ${start.y}
      A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}
    `;
  };
  
  const sizes = {
    sm: { width: 100, radius: 35, strokeWidth: 8 },
    md: { width: 140, radius: 50, strokeWidth: 10 },
    lg: { width: 180, radius: 65, strokeWidth: 12 },
  };
  
  const { width, radius, strokeWidth } = sizes[size];
  const circumference = Math.PI * radius;
  const arcLength = (ARC_ANGLE / 360) * (2 * Math.PI * radius);

  const arcPath = describeArc(
    width / 2,
    width / 2,
    radius,
    START_ANGLE,
    START_ANGLE + ARC_ANGLE
  );

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <span className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{title}</span>
      <div className="relative" style={{ width, height: width / 2 + 10 }}>
        <svg width={width} height={width / 2 + 10} className="overflow-visible">
          {/* Background arc */}
          <path
            d={arcPath}
            fill="none"
            stroke="hsl(220, 15%, 20%)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Colored arc - now counter-clockwise */}
          <path
            d={arcPath}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={arcLength - (arcLength * (percentage / 100))}
            className="transition-all duration-500"
          />
          
          {/* Needle - still clockwise */}
          <g transform={`translate(${width / 2}, ${width / 2})`}>
            <line
              x1="0"
              y1="0"
              x2="0"
              y2={-(radius - 15)}
              stroke={stroke}
              strokeWidth="2"
              strokeLinecap="round"
              transform={`rotate(${rotation})`}
              className="transition-all duration-500"
            />
            <circle r="6" fill={stroke} className="transition-all duration-500" />
          </g>
        </svg>
        <div className="absolute bottom-0 left-1/2 top-[4.5rem] transform -translate-x-1/2 text-center">
          <span className={cn("text-xl font-bold font-mono", text)}>
            {value.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground ml-1">{unit}</span>
        </div>
      </div>
    </div>
  );
};

export const ProgressBar = ({
  value,
  maxValue = 100,
  label,
  unit = 'days',
  showValue = true,
  className,
}) => {
  const percentage = Math.min(100, (value / maxValue) * 100);
  
  const getColor = () => {
    if (percentage > 66) return 'bg-status-normal';
    if (percentage > 33) return 'bg-status-warning';
    return 'bg-status-critical';
  };

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        {showValue && (
          <span className="font-mono text-foreground">
            {value} {unit}
          </span>
        )}
      </div>
      <div className="progress-bar">
        <div
          className={cn("progress-fill", getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};