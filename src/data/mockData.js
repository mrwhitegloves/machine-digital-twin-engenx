// =============================
// Motor Data (JS version)
// =============================

// Default limits
export const defaultLimits = [
  { parameter: 'motorTemperature', minimum: 20, maximum: 85, unit: '°C', description: 'Motor Temperature' },
  { parameter: 'gearBoxTemperature', minimum: 20, maximum: 80, unit: '°C', description: 'Gear Box Temperature' },
  { parameter: 'oilTemperature', minimum: 15, maximum: 65, unit: '°C', description: 'Oil Temperature' },
  { parameter: 'rpmEthernet', minimum: 0, maximum: 1500, unit: 'RPM', description: 'RPM (Ethernet)' },
  { parameter: 'rpmWifi', minimum: 0, maximum: 1500, unit: 'RPM', description: 'RPM (WiFi)' },
  { parameter: 'torque', minimum: 0, maximum: 50, unit: 'Nm', description: 'Torque' },
  { parameter: 'vibrationX', minimum: 0, maximum: 5, unit: 'mm/s', description: 'Vibration X' },
  { parameter: 'vibrationY', minimum: 0, maximum: 5, unit: 'mm/s', description: 'Vibration Y' },
  { parameter: 'vibrationZ', minimum: 0, maximum: 5, unit: 'mm/s', description: 'Vibration Z' },
  { parameter: 'current', minimum: 0, maximum: 25, unit: 'A', description: 'Current' },
  { parameter: 'voltage', minimum: 380, maximum: 420, unit: 'V', description: 'Voltage' },
  { parameter: 'power', minimum: 0, maximum: 15, unit: 'kW', description: 'Power' },
  { parameter: 'efficiency', minimum: 85, maximum: 98, unit: '%', description: 'Efficiency' },
];

// Generate random value within range
const randomInRange = (min, max, decimals = 2) => {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
};

// Generate current motor data
export const generateMotorData = () => ({
  timestamp: new Date(),
  motorTemperature: randomInRange(35, 75),
  gearBoxTemperature: randomInRange(28, 65),
  oilTemperature: randomInRange(25, 55),
  rpmEthernet: randomInRange(800, 1200),
  rpmWifi: randomInRange(795, 1195),
  torque: randomInRange(15, 35),
  vibration: {
    x: randomInRange(0.2, 2.5),
    y: randomInRange(0.3, 2.8),
    z: randomInRange(0.1, 2.2),
  },
  speed: randomInRange(5, 15),
  current: randomInRange(10, 20),
  voltage: randomInRange(395, 410),
  power: randomInRange(5, 12),
  efficiency: randomInRange(88, 96),
  magneticFlux: randomInRange(0.5, 1.2),
  forceDensity: randomInRange(50, 150),
  latencyEthernet: randomInRange(1, 10),
  latencyWifi: randomInRange(5, 50),
  energyConsumption: randomInRange(100, 500),
});

// Generate time series data
export const generateTimeSeries = (points = 20) => {
  const data = [];
  const now = Date.now();

  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date(now - i * 5000); // 5 second intervals
    data.push({
      ...generateMotorData(),
      timestamp,
    });
  }

  return data;
};

// KPI calculations
export const calculateHealthScore = (data, limits) => {
  let score = 100;
  const deductions = {};

  limits.forEach(limit => {
    let value;

    if (limit.parameter === 'motorTemperature') value = data.motorTemperature;
    else if (limit.parameter === 'gearBoxTemperature') value = data.gearBoxTemperature;
    else if (limit.parameter === 'torque') value = data.torque;
    else if (limit.parameter === 'vibrationX') value = data.vibration.x;
    else if (limit.parameter === 'vibrationY') value = data.vibration.y;
    else if (limit.parameter === 'vibrationZ') value = data.vibration.z;

    if (value !== undefined) {
      const range = limit.maximum - limit.minimum;
      const midpoint = (limit.maximum + limit.minimum) / 2;
      const deviation = Math.abs(value - midpoint) / (range / 2);

      if (value > limit.maximum || value < limit.minimum) {
        deductions[limit.parameter] = 15;
      } else if (deviation > 0.7) {
        deductions[limit.parameter] = 5;
      }
    }
  });

  Object.values(deductions).forEach(d => (score -= d));
  return Math.max(0, Math.min(100, score));
};

export const calculateRUL = (healthScore) => {
  const baseMotorRUL = 180; // days
  const baseGearboxRUL = 150; // days

  return {
    motor: Math.round(baseMotorRUL * (healthScore / 100) * randomInRange(0.8, 1.1, 2)),
    gearbox: Math.round(baseGearboxRUL * (healthScore / 100) * randomInRange(0.75, 1.05, 2)),
  };
};

export const getMachineStatus = (data) => {
  if (data.power < 2) return 'Idle';
  if (data.current > 22 || data.motorTemperature > 78) return 'Overload';
  return 'Normal';
};

export const getLoadPercentage = (data) => {
  return Math.min(100, Math.round((data.power / 12) * 100));
};

// Mock maintenance logs
export const maintenanceLogs = [
  { date: '2024-01-15', issueType: 'Bearing Wear', actionTaken: 'Replaced bearings', component: 'Motor', downtime: 120 },
  { date: '2024-01-10', issueType: 'Oil Leak', actionTaken: 'Sealed gaskets', component: 'Gearbox', downtime: 45 },
  { date: '2024-01-05', issueType: 'High Vibration', actionTaken: 'Realigned shaft', component: 'Coupling', downtime: 90 },
  { date: '2023-12-28', issueType: 'Overheating', actionTaken: 'Cleaned cooling fins', component: 'Motor', downtime: 30 },
  { date: '2023-12-20', issueType: 'Oil Degradation', actionTaken: 'Oil change', component: 'Gearbox', downtime: 60 },
  { date: '2023-12-15', issueType: 'Belt Wear', actionTaken: 'Replaced belt', component: 'Coupling', downtime: 40 },
  { date: '2023-12-08', issueType: 'Electrical Fault', actionTaken: 'Replaced capacitor', component: 'Motor', downtime: 75 },
];

// Pareto data
export const paretoData = [
  { cause: 'Bearing Wear', count: 8, cumulative: 32 },
  { cause: 'High Temp', count: 6, cumulative: 56 },
  { cause: 'Vibration', count: 5, cumulative: 76 },
  { cause: 'Oil Issues', count: 3, cumulative: 88 },
  { cause: 'Electrical', count: 2, cumulative: 96 },
  { cause: 'Other', count: 1, cumulative: 100 },
];

// Histogram data
export const histogramData = [
  { range: '10-15', count: 5 },
  { range: '15-20', count: 12 },
  { range: '20-25', count: 28 },
  { range: '25-30', count: 35 },
  { range: '30-35', count: 18 },
  { range: '35-40', count: 8 },
  { range: '40-45', count: 3 },
];

// AI Insights
export const aiInsights = [
  "Gearbox bearing vibration trend increasing. Inspection recommended in 10 days.",
  "Motor temperature trending 5% higher than baseline. Monitor cooling system.",
  "Oil viscosity degradation detected. Schedule oil change within 2 weeks.",
  "Shaft alignment deviation detected. Consider realignment during next maintenance window.",
  "Power consumption efficiency has improved 3% after last maintenance cycle.",
];

// Component status for 3D model
export const getComponentStatuses = (data, limits) => {
  const motorTempLimit = limits.find(l => l.parameter === 'motorTemperature');
  const gearboxTempLimit = limits.find(l => l.parameter === 'gearBoxTemperature');

  const getStatus = (value, min, max) => {
    if (value > max * 0.95 || value < min * 1.05) return 'critical';
    if (value > max * 0.85 || value < min * 1.15) return 'warning';
    return 'normal';
  };

  return [
    {
      name: 'Motor',
      status: motorTempLimit
        ? getStatus(data.motorTemperature, motorTempLimit.minimum, motorTempLimit.maximum)
        : 'normal',
      rpm: data.rpmEthernet,
      temperature: data.motorTemperature,
      vibration: data.vibration,
    },
    {
      name: 'Shaft',
      status: 'normal',
      rpm: data.rpmEthernet,
      torque: data.torque,
    },
    {
      name: 'Coupling',
      status: data.vibration.x > 3 || data.vibration.y > 3 ? 'warning' : 'normal',
      torque: data.torque,
      vibration: data.vibration,
    },
    {
      name: 'Gearbox',
      status: gearboxTempLimit
        ? getStatus(data.gearBoxTemperature, gearboxTempLimit.minimum, gearboxTempLimit.maximum)
        : 'normal',
      temperature: data.gearBoxTemperature,
      rpm: Math.round(data.rpmEthernet * 0.4),
      torque: data.torque * 2.5,
    },
  ];
};
