// WhatIfAnalysisTab.jsx
import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertTriangle, TrendingUp, ThermometerSun, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';

export const WhatIfAnalysisTab = ({ currentData }) => {
  // Simulation controls
  const [rpmIncrease, setRpmIncrease] = useState(0);
  const [loadIncrease, setLoadIncrease] = useState(0);
  const [poorLubrication, setPoorLubrication] = useState(false);

  // Simulated outputs
  const [predictions, setPredictions] = useState({
    temperatureRise: 0,
    stressIncrease: 0,
    failureAcceleration: 0,
    estimatedLife: 180,
  });

  // Calculate predictions based on inputs
  useEffect(() => {
    const baseTemp = currentData.motorTemperature;
    
    // Temperature rise calculation
    let tempRise = (rpmIncrease / 100) * 15 + (loadIncrease / 100) * 20;
    if (poorLubrication) tempRise += 12;

    // Stress increase calculation
    let stressInc = (rpmIncrease / 100) * 25 + (loadIncrease / 100) * 35;
    if (poorLubrication) stressInc += 20;

    // Failure acceleration
    let failureAcc = (rpmIncrease / 100) * 30 + (loadIncrease / 100) * 40;
    if (poorLubrication) failureAcc += 50;

    // Estimated life reduction
    const lifeReduction = Math.min(150, failureAcc * 1.2);
    const estimatedLife = Math.max(30, 180 - lifeReduction);

    setPredictions({
      temperatureRise: tempRise,
      stressIncrease: stressInc,
      failureAcceleration: failureAcc,
      estimatedLife,
    });
  }, [rpmIncrease, loadIncrease, poorLubrication, currentData]);

  const getStatusColor = (value, thresholds) => {
    if (value < thresholds[0]) return 'text-status-normal';
    if (value < thresholds[1]) return 'text-status-warning';
    return 'text-status-critical';
  };

  const SimulationCard = ({ 
    title, 
    value, 
    unit, 
    icon: Icon, 
    thresholds 
  }) => (
    <div className="industrial-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("w-5 h-5", getStatusColor(value, thresholds))} />
        <span className="text-sm text-muted-foreground">{title}</span>
      </div>
      <div className={cn("text-3xl font-bold font-mono", getStatusColor(value, thresholds))}>
        {value > 0 ? '+' : ''}{value.toFixed(1)}
        <span className="text-sm text-muted-foreground ml-1">{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="absolute inset-0 flex pointer-events-auto">
      {/* Left Panel - Controls */}
      <div className="w-[300px] p-4 space-y-4 overflow-y-auto">
        <div className="industrial-card">
          <div className="industrial-card-header">Simulation Controls</div>
          <div className="p-4 space-y-6">
            {/* RPM Increase Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm text-muted-foreground">RPM Increase</Label>
                <span className="font-mono text-primary">+{rpmIncrease}%</span>
              </div>
              <Slider
                value={[rpmIncrease]}
                onValueChange={(v) => setRpmIncrease(v[0])}
                max={100}
                step={5}
                className="accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Load Increase Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm text-muted-foreground">Load Increase</Label>
                <span className="font-mono text-primary">+{loadIncrease}%</span>
              </div>
              <Slider
                value={[loadIncrease]}
                onValueChange={(v) => setLoadIncrease(v[0])}
                max={100}
                step={5}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Poor Lubrication Toggle */}
            {/* <div className="flex items-center justify-between py-2">
              <Label className="text-sm text-muted-foreground">Poor Lubrication</Label>
              <Switch
                checked={poorLubrication}
                onCheckedChange={setPoorLubrication}
              />
            </div> */}
          </div>
        </div>

        {/* Current Conditions */}
        <div className="industrial-card">
          <div className="industrial-card-header">Current Conditions</div>
          <div className="p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base Temperature</span>
              <span className="font-mono">{currentData.motorTemperature.toFixed(1)}°C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current RPM</span>
              <span className="font-mono">{currentData.rpmEthernet.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Load</span>
              <span className="font-mono">{((currentData.power / 12) * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Torque</span>
              <span className="font-mono">{currentData.torque.toFixed(1)} Nm</span>
            </div>
          </div>
        </div>

        {/* Scenario Presets */}
        <div className="industrial-card">
          <div className="industrial-card-header">Scenario Presets</div>
          <div className="p-3 grid grid-cols-2 gap-2">
            {[
              { name: 'Normal', rpm: 0, load: 0, lub: false },
              { name: 'High Speed', rpm: 50, load: 20, lub: false },
              { name: 'Heavy Load', rpm: 20, load: 70, lub: false },
              { name: 'Worst Case', rpm: 80, load: 80, lub: true },
            ].map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  setRpmIncrease(preset.rpm);
                  setLoadIncrease(preset.load);
                  setPoorLubrication(preset.lub);
                }}
                className={cn(
                  "px-3 py-2 text-xs rounded border border-border bg-secondary/50 hover:bg-secondary transition-colors",
                  preset.name === 'Worst Case' && "border-status-critical/50 text-status-critical"
                )}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Center - 3D Model space */}
      <div className="flex-1 relative" />

      {/* Right Panel - Predictions */}
      <div className="w-[300px] p-4 space-y-3 overflow-y-auto">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Simulated Predictions
        </h3>

        <SimulationCard
          title="Predicted Temperature Rise"
          value={predictions.temperatureRise}
          unit="°C"
          icon={ThermometerSun}
          thresholds={[10, 25]}
        />

        <SimulationCard
          title="Stress Increase"
          value={predictions.stressIncrease}
          unit="%"
          icon={Gauge}
          thresholds={[20, 50]}
        />

        <SimulationCard
          title="Failure Acceleration"
          value={predictions.failureAcceleration}
          unit="%"
          icon={TrendingUp}
          thresholds={[30, 60]}
        />

        {/* Estimated Life Card */}
        <div className="industrial-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className={cn(
              "w-5 h-5",
              predictions.estimatedLife > 120 ? 'text-status-normal' :
              predictions.estimatedLife > 60 ? 'text-status-warning' : 'text-status-critical'
            )} />
            <span className="text-sm text-muted-foreground">Estimated Remaining Life</span>
          </div>
          <div className="relative h-4 bg-muted rounded-full overflow-hidden mb-2">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                predictions.estimatedLife > 120 ? 'bg-status-normal' :
                predictions.estimatedLife > 60 ? 'bg-status-warning' : 'bg-status-critical'
              )}
              style={{ width: `${(predictions.estimatedLife / 180) * 100}%` }}
            />
          </div>
          <div className="flex justify-between">
            <span className={cn(
              "text-2xl font-bold font-mono",
              predictions.estimatedLife > 120 ? 'text-status-normal' :
              predictions.estimatedLife > 60 ? 'text-status-warning' : 'text-status-critical'
            )}>
              {predictions.estimatedLife.toFixed(0)}
              <span className="text-sm text-muted-foreground ml-1">days</span>
            </span>
            <span className="text-xs text-muted-foreground self-end">
              (Base: 180 days)
            </span>
          </div>
        </div>

        {/* Recommendations */}
        <div className="industrial-card">
          <div className="industrial-card-header">Recommendations</div>
          <div className="p-4 space-y-2 text-xs">
            {predictions.temperatureRise > 20 && (
              <div className="flex items-start gap-2 p-2 bg-status-warning/10 rounded border border-status-warning/30">
                <span className="text-status-warning">⚠</span>
                <span>Consider enhanced cooling system for prolonged high-temperature operation</span>
              </div>
            )}
            {predictions.stressIncrease > 40 && (
              <div className="flex items-start gap-2 p-2 bg-status-critical/10 rounded border border-status-critical/30">
                <span className="text-status-critical">!</span>
                <span>Reduce load to prevent mechanical stress damage</span>
              </div>
            )}
            {poorLubrication && (
              <div className="flex items-start gap-2 p-2 bg-status-critical/10 rounded border border-status-critical/30">
                <span className="text-status-critical">!</span>
                <span>Schedule immediate lubrication maintenance</span>
              </div>
            )}
            {predictions.failureAcceleration < 20 && (
              <div className="flex items-start gap-2 p-2 bg-status-normal/10 rounded border border-status-normal/30">
                <span className="text-status-normal">✓</span>
                <span>Operating conditions are within safe parameters</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};