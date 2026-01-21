// IndustrialChart.jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, ComposedChart, Area, ScatterChart, Scatter, Cell } from 'recharts';
import { cn } from '@/lib/utils';

const defaultColors = [
  'hsl(190, 95%, 50%)',  // cyan
  'hsl(142, 76%, 45%)',  // green
  'hsl(45, 93%, 55%)',   // yellow
  'hsl(0, 72%, 51%)',    // red
  'hsl(270, 70%, 55%)',  // purple
];

export const IndustrialLineChart = ({
  title,
  data,
  dataKey,
  xAxisKey = 'time',
  minThreshold,
  maxThreshold,
  className,
  height = 120,
  showGrid = true,
  colors = defaultColors,
}) => {
  const keys = Array.isArray(dataKey) ? dataKey : [dataKey];

  return (
    <div className={cn("industrial-card", className)}>
      <div className="industrial-card-header">{title}</div>
      <div className="p-3">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />}
            <XAxis 
              dataKey={xAxisKey} 
              tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }}
              axisLine={{ stroke: 'hsl(220, 15%, 20%)' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }}
              axisLine={{ stroke: 'hsl(220, 15%, 20%)' }}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(220, 18%, 12%)',
                border: '1px solid hsl(220, 15%, 25%)',
                borderRadius: '6px',
                fontSize: '12px',
              }}
            />
            {minThreshold !== undefined && (
              <ReferenceLine y={minThreshold} stroke="hsl(45, 93%, 55%)" strokeDasharray="3 3" />
            )}
            {maxThreshold !== undefined && (
              <ReferenceLine y={maxThreshold} stroke="hsl(0, 72%, 51%)" strokeDasharray="3 3" />
            )}
            {keys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: colors[index % colors.length] }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const IndustrialBarChart = ({
  title,
  data,
  dataKey,
  xAxisKey = 'name',
  className,
  height = 120,
  colors = defaultColors,
}) => {
  return (
    <div className={cn("industrial-card", className)}>
      <div className="industrial-card-header">{title}</div>
      <div className="p-3">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
            <XAxis 
              dataKey={xAxisKey}
              tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }}
              axisLine={{ stroke: 'hsl(220, 15%, 20%)' }}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }}
              axisLine={{ stroke: 'hsl(220, 15%, 20%)' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(220, 18%, 12%)',
                border: '1px solid hsl(220, 15%, 25%)',
                borderRadius: '6px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey={dataKey} fill={colors[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const ParetoChart = ({
  title,
  data,
  className,
  height = 150,
}) => {
  return (
    <div className={cn("industrial-card", className)}>
      <div className="industrial-card-header">{title}</div>
      <div className="p-3">
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
            <XAxis 
              dataKey="cause"
              tick={{ fontSize: 9, fill: 'hsl(215, 15%, 55%)' }}
              axisLine={{ stroke: 'hsl(220, 15%, 20%)' }}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }}
              axisLine={{ stroke: 'hsl(220, 15%, 20%)' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }}
              axisLine={{ stroke: 'hsl(220, 15%, 20%)' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(220, 18%, 12%)',
                border: '1px solid hsl(220, 15%, 25%)',
                borderRadius: '6px',
                fontSize: '12px',
              }}
            />
            <Bar yAxisId="left" dataKey="count" fill="hsl(45, 80%, 55%)" radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="hsl(190, 95%, 50%)" strokeWidth={2} dot={{ fill: 'hsl(190, 95%, 50%)' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const CorrelationMatrix = ({
  title,
  data,
  className,
}) => {
  const labels = ['MC', 'OT', 'MTQ', 'GBV', 'MT', 'GBS'];
  
  // Generate correlation values
  const correlations = labels.map((row, i) => 
    labels.map((col, j) => {
      if (i === j) return 1;
      return Math.random() * 2 - 1; // Random correlation between -1 and 1
    })
  );

  const getColor = (value) => {
    if (value > 0.5) return 'bg-status-normal/60';
    if (value > 0) return 'bg-status-normal/30';
    if (value > -0.5) return 'bg-status-warning/30';
    return 'bg-status-critical/30';
  };

  return (
    <div className={cn("industrial-card", className)}>
      <div className="industrial-card-header">{title}</div>
      <div className="p-3 overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="p-1"></th>
              {labels.map(label => (
                <th key={label} className="p-1 text-muted-foreground">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {labels.map((rowLabel, i) => (
              <tr key={rowLabel}>
                <td className="p-1 text-muted-foreground font-medium">{rowLabel}</td>
                {correlations[i].map((value, j) => (
                  <td key={j} className={cn("p-1 text-center rounded", getColor(value))}>
                    {value.toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const ControlChart = ({
  title,
  data,
  dataKey,
  ucl,
  lcl,
  className,
  height = 120,
}) => {
  const mean = (ucl + lcl) / 2;

  return (
    <div className={cn("industrial-card", className)}>
      <div className="industrial-card-header">{title}</div>
      <div className="p-3">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
            <XAxis 
              dataKey="time"
              tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }}
              axisLine={{ stroke: 'hsl(220, 15%, 20%)' }}
            />
            <YAxis 
              domain={[lcl - 5, ucl + 5]}
              tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }}
              axisLine={{ stroke: 'hsl(220, 15%, 20%)' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(220, 18%, 12%)',
                border: '1px solid hsl(220, 15%, 25%)',
                borderRadius: '6px',
                fontSize: '12px',
              }}
            />
            <ReferenceLine y={ucl} stroke="hsl(0, 72%, 51%)" strokeDasharray="3 3" label={{ value: 'UCL', fontSize: 10, fill: 'hsl(0, 72%, 51%)' }} />
            <ReferenceLine y={mean} stroke="hsl(142, 76%, 45%)" strokeDasharray="3 3" label={{ value: 'CL', fontSize: 10, fill: 'hsl(142, 76%, 45%)' }} />
            <ReferenceLine y={lcl} stroke="hsl(0, 72%, 51%)" strokeDasharray="3 3" label={{ value: 'LCL', fontSize: 10, fill: 'hsl(0, 72%, 51%)' }} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="hsl(190, 95%, 50%)"
              strokeWidth={2}
              dot={{ fill: 'hsl(190, 95%, 50%)', r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};