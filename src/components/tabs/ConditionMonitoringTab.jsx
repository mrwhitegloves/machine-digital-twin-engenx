// ConditionMonitoringTab.jsx
import React from 'react';
import { IndustrialLineChart } from '@/components/IndustrialChart.jsx';
import { cn } from '@/lib/utils';

export const ConditionMonitoringTab = ({
  timeSeriesData,
  currentData,
  limits
}) => {
  // Format time series data for charts
  const formatChartData = (data) => {
    return data.map((d, i) => ({
      time: new Date(d.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }),
      motorTemp: d.motorTemperature,
      gearboxTemp: d.gearBoxTemperature,
      oilTemp: d.oilTemperature,
      vibX: d.vibration.x,
      vibY: d.vibration.y,
      vibZ: d.vibration.z,
      rpmMotor: d.rpmEthernet,
      rpmGearbox: d.rpmWifi,
      latencyEthernet: d.latencyEthernet,
      latencyWifi: d.latencyWifi,
    }));
  };

  console.log("timeSeriesData: ", timeSeriesData);
  console.log("currentData: ", currentData);

  const chartData = formatChartData(timeSeriesData);
  const tempLimit = limits.find(l => l.parameter === 'motorTemperature');
  const vibLimit = limits.find(l => l.parameter === 'vibrationX');

  const ValueDisplay = ({ label, value, unit, status = 'normal' }) => (
    <div className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn(
        "text-sm font-mono font-semibold",
        status === 'normal' && "text-status-normal",
        status === 'warning' && "text-status-warning",
        status === 'critical' && "text-status-critical"
      )}>
        {value.toFixed(2)} <span className="text-xs text-muted-foreground">{unit}</span>
      </span>
    </div>
  );

  const getStatus = (value, param) => {
    const limit = limits.find(l => l.parameter === param);
    if (!limit) return 'normal';
    if (value > limit.maximum * 0.95 || value < limit.minimum * 1.05) return 'critical';
    if (value > limit.maximum * 0.85 || value < limit.minimum * 1.15) return 'warning';
    return 'normal';
  };

  return (
    <div className="absolute inset-0 flex pointer-events-auto">
      {/* Left Panel - Charts */}
      <div className="w-[300px] p-3 space-y-3 overflow-y-auto">
        <IndustrialLineChart
          title="Hardware Temperature"
          data={chartData}
          dataKey={['motorTemp', 'gearboxTemp', 'oilTemp']}
          minThreshold={tempLimit?.minimum}
          maxThreshold={tempLimit?.maximum}
          height={100}
          colors={['hsl(0, 72%, 51%)', 'hsl(45, 93%, 55%)', 'hsl(190, 95%, 50%)']}
        />

        <div className="industrial-card">
          <div className="industrial-card-header">Current Readings</div>
          <div className="p-3">
            <ValueDisplay
              label="Gear Box Temperature"
              value={currentData.gearBoxTemperature}
              unit="°C"
              status={getStatus(currentData.gearBoxTemperature, 'gearBoxTemperature')}
            />
            <ValueDisplay
              label="Motor Temperature"
              value={currentData.motorTemperature}
              unit="°C"
              status={getStatus(currentData.motorTemperature, 'motorTemperature')}
            />
            <ValueDisplay
              label="Oil Temperature"
              value={currentData.oilTemperature}
              unit="°C"
              status={getStatus(currentData.oilTemperature, 'oilTemperature')}
            />
          </div>
        </div>

        <IndustrialLineChart
          title="Gear Box Vibration"
          data={chartData}
          dataKey={['vibX', 'vibY', 'vibZ']}
          maxThreshold={vibLimit?.maximum}
          height={100}
          colors={['hsl(190, 95%, 50%)', 'hsl(142, 76%, 45%)', 'hsl(270, 70%, 55%)']}
        />

        <div className="industrial-card">
          <div className="industrial-card-header">Vibration Readings</div>
          <div className="p-3">
            <ValueDisplay
              label="Vibration X"
              value={currentData.vibration.x}
              unit="mm/s"
              status={getStatus(currentData.vibration.x, 'vibrationX')}
            />
            <ValueDisplay
              label="Vibration Y"
              value={currentData.vibration.y}
              unit="mm/s"
              status={getStatus(currentData.vibration.y, 'vibrationY')}
            />
            <ValueDisplay
              label="Vibration Z"
              value={currentData.vibration.z}
              unit="mm/s"
              status={getStatus(currentData.vibration.z, 'vibrationZ')}
            />
          </div>
        </div>

        <IndustrialLineChart
          title="Latency"
          data={chartData}
          dataKey={['latencyEthernet', 'latencyWifi']}
          height={100}
          colors={['hsl(190, 95%, 50%)', 'hsl(0, 72%, 51%)']}
        />

        <div className="industrial-card">
          <div className="industrial-card-header">Network Status</div>
          <div className="p-3">
            <ValueDisplay
              label="WiFi Latency"
              value={currentData.latencyWifi}
              unit="ms"
              status={currentData.latencyWifi > 30 ? 'warning' : 'normal'}
            />
            <ValueDisplay
              label="Ethernet Latency"
              value={currentData.latencyEthernet}
              unit="ms"
              status={currentData.latencyEthernet > 10 ? 'warning' : 'normal'}
            />
          </div>
        </div>
      </div>

      {/* Spacer for 3D view */}
      <div className="flex-1" />

      {/* Right Panel - Torque & RPM */}
      <div className="w-[300px] p-3 space-y-3 overflow-y-auto">
        <IndustrialLineChart
          title="Torque"
          data={chartData.map(d => ({ ...d, torque: currentData.torque + (Math.random() - 0.5) * 5 }))}
          dataKey="torque"
          height={120}
        />

        <div className="industrial-card">
          <div className="industrial-card-header">Torque Status</div>
          <div className="p-3">
            <ValueDisplay
              label="Torque"
              value={currentData.torque}
              unit="Nm"
              status={getStatus(currentData.torque, 'torque')}
            />
          </div>
        </div>

        <IndustrialLineChart
          title="RPM Comparison"
          data={chartData}
          dataKey={['rpmMotor', 'rpmGearbox']}
          height={120}
          colors={['hsl(190, 95%, 50%)', 'hsl(142, 76%, 45%)']}
        />

        <div className="industrial-card">
          <div className="industrial-card-header">Speed Readings</div>
          <div className="p-3">
            <ValueDisplay
              label="RPM (Motor)"
              value={currentData.rpmEthernet}
              unit="RPM"
              status={getStatus(currentData.rpmEthernet, 'rpmEthernet')}
            />
            <ValueDisplay
              label="RPM (Gearbox)"
              value={currentData.rpmWifi}
              unit="RPM"
              status={getStatus(currentData.rpmWifi, 'rpmWifi')}
            />
          </div>
        </div>

        <div className="industrial-card">
          <div className="industrial-card-header">Power Metrics</div>
          <div className="p-3">
            <ValueDisplay
              label="Current"
              value={currentData.current}
              unit="A"
              status={getStatus(currentData.current, 'current')}
            />
            <ValueDisplay
              label="Voltage"
              value={currentData.voltage}
              unit="V"
              status={getStatus(currentData.voltage, 'voltage')}
            />
            <ValueDisplay
              label="Power"
              value={currentData.power}
              unit="kW"
            />
            <ValueDisplay
              label="Efficiency"
              value={currentData.efficiency}
              unit="%"
              status={currentData.efficiency < 88 ? 'warning' : 'normal'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};