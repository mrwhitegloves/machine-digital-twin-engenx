// PredictiveMaintenanceTab.jsx
import React, { useEffect, useState } from 'react';
import { GaugeChart, ProgressBar } from '@/components/GaugeChart.jsx';
import { aiInsights } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { AlertTriangle, Lightbulb, Activity, Zap } from 'lucide-react';

export const PredictiveMaintenanceTab = ({
  currentData,
  healthScore,
  rul,
}) => {
  const [currentInsight, setCurrentInsight] = useState(0);

  // Rotate through AI insights
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentInsight((prev) => (prev + 1) % aiInsights.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calculate failure probability based on health score
  const failureProbability = Math.max(5, 100 - healthScore + Math.random() * 10);

  const DataOverlay = ({ label, value, unit, position }) => (
    <div className={cn(
      "absolute bg-card/80 backdrop-blur-sm px-3 py-1.5 rounded border border-border text-sm",
      position
    )}>
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-2 font-mono text-foreground">{value.toFixed(2)}</span>
      <span className="text-xs text-muted-foreground ml-1">{unit}</span>
    </div>
  );

  return (
    <div className="absolute inset-0 flex pointer-events-auto">
      {/* Left Panel */}
      <div className="w-[300px] p-3 space-y-3 overflow-y-auto">
        {/* Magnetic Field Visualization */}
        <div className="industrial-card">
          <div className="industrial-card-header">Magnetic Field</div>
          <div className="p-4 flex flex-col items-center">
            <div className="relative w-[180px] h-[180px]">
              {/* Magnetic field visualization - concentric rings */}
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {[...Array(5)].map((_, i) => (
                  <circle
                    key={i}
                    cx="100"
                    cy="100"
                    r={20 + i * 18}
                    fill="none"
                    stroke={`hsl(${190 + i * 20}, 80%, ${50 - i * 5}%)`}
                    strokeWidth="2"
                    opacity={1 - i * 0.15}
                  />
                ))}
                {/* Field lines */}
                {[...Array(12)].map((_, i) => {
                  const angle = (i * 30 * Math.PI) / 180;
                  return (
                    <line
                      key={i}
                      x1={100 + Math.cos(angle) * 20}
                      y1={100 + Math.sin(angle) * 20}
                      x2={100 + Math.cos(angle) * 90}
                      y2={100 + Math.sin(angle) * 90}
                      stroke="hsl(190, 95%, 50%)"
                      strokeWidth="1"
                      opacity="0.5"
                    />
                  );
                })}
                {/* Center core */}
                <circle cx="100" cy="100" r="15" fill="hsl(220, 18%, 20%)" />
                <circle cx="100" cy="100" r="10" fill="hsl(190, 95%, 50%)" opacity="0.8" />
              </svg>
            </div>
            <div className="mt-2 text-center">
              <span className="text-xs text-muted-foreground">Magnetic Flux: </span>
              <span className="font-mono text-primary">{currentData.magneticFlux.toFixed(3)} T</span>
            </div>
          </div>
        </div>

        {/* Magnetic Flux Lines Chart */}
        <div className="industrial-card">
          <div className="industrial-card-header">Magnetic Flux Lines</div>
          <div className="p-4">
            <div className="h-24 flex items-end gap-1">
              {[...Array(20)].map((_, i) => {
                const height = 30 + Math.sin(i * 0.5 + Date.now() / 1000) * 20 + Math.random() * 30;
                return (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-primary to-accent rounded-t transition-all duration-300"
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="50"
              className="w-full mt-3 accent-primary"
            />
          </div>
        </div>
      </div>

      {/* Center - Data Overlays (positioned over 3D model) */}
      <div className="flex-1 relative pointer-events-none">
        <DataOverlay 
          label="Vibration X,Y,Z" 
          value={currentData.vibration.x} 
          unit={`${currentData.vibration.y.toFixed(1)}, ${currentData.vibration.z.toFixed(1)}`} 
          position="top-4 right-4" 
        />
        <DataOverlay 
          label="Motor Temperature" 
          value={currentData.motorTemperature} 
          unit="°C" 
          position="top-4 left-4" 
        />
        <DataOverlay 
          label="Oil Temperature" 
          value={currentData.oilTemperature} 
          unit="°C" 
          position="bottom-5 left-4" 
        />
        <DataOverlay 
          label="Torque Sensor" 
          value={currentData.torque} 
          unit="Nm" 
          position="top-[50%] left-4" 
        />
        <DataOverlay 
          label="RPM(wifi)" 
          value={currentData.rpmWifi} 
          unit="" 
          position="top-[50%] right-4" 
        />
        <DataOverlay 
          label="RPM(ethernet)" 
          value={currentData.rpmEthernet} 
          unit="" 
          position="bottom-5 right-4" 
        />
      </div>

      {/* Right Panel */}
      <div className="w-[300px] p-3 space-y-3 overflow-y-auto">
        {/* Failure Probability Gauge */}
        <div className="industrial-card">
          <div className="industrial-card-header">Failure Probability (30 days)</div>
          <div className="p-4">
            <GaugeChart
              value={failureProbability}
              maxValue={100}
              title=""
              unit="%"
              size="md"
            />
          </div>
        </div>

        {/* RUL Progress Bars */}
        <div className="industrial-card">
          <div className="industrial-card-header">Remaining Useful Life</div>
          <div className="p-4 space-y-4">
            <ProgressBar
              value={rul.motor}
              maxValue={180}
              label="Motor"
              unit="days"
            />
            <ProgressBar
              value={rul.gearbox}
              maxValue={150}
              label="Gearbox"
              unit="days"
            />
          </div>
        </div>

        {/* AI Insights */}
        <div className="industrial-card">
          <div className="industrial-card-header flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            AI Insights
          </div>
          <div className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-status-warning flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground leading-relaxed animate-pulse-glow">
                {aiInsights[currentInsight]}
              </p>
            </div>
          </div>
        </div>

        {/* Force Density Visualization */}
        <div className="industrial-card">
          <div className="industrial-card-header">Force Density</div>
          <div className="p-4 flex flex-col items-center">
            <div className="relative w-[160px] h-[160px]">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {/* Radial force density visualization */}
                {[...Array(24)].map((_, i) => {
                  const angle = (i * 15 * Math.PI) / 180;
                  const intensity = 0.5 + Math.random() * 0.5;
                  const length = 30 + intensity * 40;
                  return (
                    <g key={i}>
                      <line
                        x1={100 + Math.cos(angle) * 40}
                        y1={100 + Math.sin(angle) * 40}
                        x2={100 + Math.cos(angle) * (40 + length)}
                        y2={100 + Math.sin(angle) * (40 + length)}
                        stroke={`hsl(${120 - intensity * 80}, 70%, 50%)`}
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </g>
                  );
                })}
                <circle cx="100" cy="100" r="35" fill="hsl(220, 18%, 15%)" stroke="hsl(220, 15%, 30%)" strokeWidth="2" />
                <text x="100" y="105" textAnchor="middle" fill="hsl(210, 20%, 92%)" fontSize="14" fontFamily="monospace">
                  {currentData.forceDensity.toFixed(0)}
                </text>
              </svg>
            </div>
            <span className="text-xs text-muted-foreground mt-1">
              Force Density: {currentData.forceDensity.toFixed(1)} N/m²
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="industrial-card">
          <div className="industrial-card-header">System Health</div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <div>
                <div className="text-lg font-bold font-mono text-status-normal">{healthScore}</div>
                <div className="text-xs text-muted-foreground">Health Score</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-status-warning" />
              <div>
                <div className="text-lg font-bold font-mono">{currentData.efficiency.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Efficiency</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};