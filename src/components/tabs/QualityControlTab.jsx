// QualityControlTab.jsx
import React from 'react';
import { ParetoChart, CorrelationMatrix, IndustrialBarChart, ControlChart } from '@/components/IndustrialChart.jsx';
import { paretoData, histogramData } from '@/data/mockData';

export const QualityControlTab = ({ timeSeriesData, currentData }) => {
  // Generate control chart data
  const controlChartData = React.useMemo(() => {
    return timeSeriesData.map((d, i) => ({
      time: new Date(d.timestamp).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      temperature: d.motorTemperature,
    }));
  }, [timeSeriesData]);

  // Generate histogram data based on current torque readings
  const dynamicHistogramData = React.useMemo(() => {
    return histogramData.map(item => ({
      ...item,
      count: item.count + Math.floor(Math.random() * 5),
    }));
  }, [currentData]);

  return (
    <div className="absolute inset-0 flex pointer-events-auto">
      {/* Left Panel */}
      <div className="w-[300px] p-3 space-y-3 overflow-y-auto">
        <ParetoChart
          title="Pareto Diagram"
          data={paretoData}
          height={180}
        />

        <IndustrialBarChart
          title="Histogram"
          data={dynamicHistogramData}
          dataKey="count"
          xAxisKey="range"
          height={160}
          colors={['hsl(45, 80%, 55%)']}
        />

        <ControlChart
          title="Control Charts"
          data={controlChartData}
          dataKey="temperature"
          ucl={75}
          lcl={35}
          height={140}
        />
      </div>

      {/* Center - 3D Model space */}
      <div className="flex-1 relative">
        {/* This area shows the 3D model underneath */}
      </div>

      {/* Right Panel */}
      <div className="w-[300px] p-3 space-y-3 overflow-y-auto">
        <CorrelationMatrix
          title="Correlation Matrix"
          data={[]}
        />

        {/* Quality Metrics */}
        <div className="industrial-card">
          <div className="industrial-card-header">Quality Metrics</div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cp (Process Capability)</span>
              <span className="font-mono text-status-normal">1.45</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cpk (Process Performance)</span>
              <span className="font-mono text-status-normal">1.32</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">PPM (Defects)</span>
              <span className="font-mono text-status-warning">45</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Sigma Level</span>
              <span className="font-mono text-status-normal">4.2σ</span>
            </div>
          </div>
        </div>

        {/* SPC Status */}
        <div className="industrial-card">
          <div className="industrial-card-header">SPC Status</div>
          <div className="p-4 space-y-2">
            {[
              { param: 'Motor Temp', status: 'In Control', ok: true },
              { param: 'Gearbox Temp', status: 'In Control', ok: true },
              { param: 'Vibration X', status: 'Warning', ok: false },
              { param: 'Torque', status: 'In Control', ok: true },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
                <span className="text-sm text-muted-foreground">{item.param}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${item.ok ? 'bg-status-normal/20 text-status-normal' : 'bg-status-warning/20 text-status-warning'}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Violations */}
        <div className="industrial-card">
          <div className="industrial-card-header">Recent Violations</div>
          <div className="p-4 space-y-2 text-xs">
            <div className="flex items-start gap-2 p-2 bg-status-warning/10 rounded border border-status-warning/30">
              <span className="text-status-warning">⚠</span>
              <div>
                <div className="text-foreground">Vibration X exceeded UCL</div>
                <div className="text-muted-foreground">Today, 14:23</div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2 bg-muted/30 rounded border border-border">
              <span className="text-muted-foreground">ℹ</span>
              <div>
                <div className="text-foreground">Temperature trend shift detected</div>
                <div className="text-muted-foreground">Yesterday, 09:15</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};