import { useState, useEffect, useCallback } from 'react';
import { KPICard } from '@/components/KPICard.jsx';
import { DigitalTwinViewer } from '@/components/DigitalTwinViewer';
import { ConditionMonitoringTab } from '@/components/tabs/ConditionMonitoringTab';
import { PredictiveMaintenanceTab } from '@/components/tabs/PredictiveMaintenanceTab';
import { QualityControlTab } from '@/components/tabs/QualityControlTab';
import { WhatIfAnalysisTab } from '@/components/tabs/WhatIfAnalysisTab';
import { SettingsModal, MaintenanceLogModal } from '@/components/SettingsModal';
import { ThemeToggle } from '@/components/ThemeToggle.jsx';
import {
  generateMotorData,
  generateTimeSeries,
  calculateHealthScore,
  calculateRUL,
  getMachineStatus,
  getLoadPercentage,
  getComponentStatuses,
  defaultLimits,
} from '@/data/mockData';
import { cn } from '@/lib/utils';
import {
  Settings,
  FileText,
  Activity,
  Thermometer,
  Gauge,
  AlertTriangle,
  Zap,
  Power,
} from 'lucide-react';
import { useTheme } from 'next-themes';

const Dashboard = () => {
  // State
  const [activeTab, setActiveTab] = useState('condition');
  const [currentData, setCurrentData] = useState(generateMotorData());
  const [timeSeriesData, setTimeSeriesData] = useState(generateTimeSeries(20));
  const [limits, setLimits] = useState(defaultLimits);
  const [healthScore, setHealthScore] = useState(85);
  const [rul, setRul] = useState({ motor: 145, gearbox: 112 });
  const [componentStatuses, setComponentStatuses] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [maintenanceLogOpen, setMaintenanceLogOpen] = useState(false);
  const [motorRunning, setMotorRunning] = useState(false);
  const [rotationDirection, setRotationDirection] = useState(1); // 1 = forward, -1 = reverse

  const { theme, resolvedTheme, setTheme } = useTheme();
  console.log("theme: ",theme)
  console.log("resolvedTheme: ",resolvedTheme)

  // Calculate alerts based on limits
  const calculateAlerts = useCallback((data, limits) => {
    let alertCount = 0;

    limits.forEach((limit) => {
      let value;

      if (limit.parameter === 'motorTemperature') value = data.motorTemperature;
      else if (limit.parameter === 'gearBoxTemperature') value = data.gearBoxTemperature;
      else if (limit.parameter === 'torque') value = data.torque;
      else if (limit.parameter === 'vibrationX') value = data.vibration.x;
      else if (limit.parameter === 'vibrationY') value = data.vibration.y;
      else if (limit.parameter === 'vibrationZ') value = data.vibration.z;

      if (value !== undefined && (value > limit.maximum || value < limit.minimum)) {
        alertCount++;
      }
    });

    return alertCount;
  }, []);

  // Update data every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const newData = generateMotorData();
      setCurrentData(newData);

      setTimeSeriesData((prev) => {
        const updated = [...prev.slice(1), newData];
        return updated;
      });

      const newHealthScore = calculateHealthScore(newData, limits);
      setHealthScore(newHealthScore);
      setRul(calculateRUL(newHealthScore));
      setComponentStatuses(getComponentStatuses(newData, limits));
      setActiveAlerts(calculateAlerts(newData, limits));
    }, 2000);

    return () => clearInterval(interval);
  }, [limits, calculateAlerts]);

  // Initial calculations
  useEffect(() => {
    const score = calculateHealthScore(currentData, limits);
    setHealthScore(score);
    setRul(calculateRUL(score));
    setComponentStatuses(getComponentStatuses(currentData, limits));
    setActiveAlerts(calculateAlerts(currentData, limits));
  }, []);

  const machineStatus = getMachineStatus(currentData);
  const loadPercentage = getLoadPercentage(currentData);

  const getHealthStatus = (score) => {
    if (score >= 80) return 'normal';
    if (score >= 60) return 'warning';
    return 'critical';
  };

  const getMachineStatusColor = (status) => {
    if (status === 'Normal') return 'normal';
    if (status === 'Idle') return 'warning';
    return 'critical';
  };

  const tabs = [
    { id: 'condition', label: 'Condition Monitoring' },
    { id: 'predictive', label: 'Predictive Maintenance' },
    { id: 'quality', label: 'Quality Control' },
    { id: 'whatif', label: 'What-If Analysis' },
  ];

  const handleComponentClick = (component) => {
    console.log('Component clicked:', component);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="h-full flex items-center justify-between px-4">
          {/* Tabs */}
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'tab-button rounded-lg',
                  activeTab === tab.id && 'active'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <div className=" bottom-6 right-6 z-50 flex gap-3 bg-background/80 backdrop-blur-md p-1 rounded-lg border shadow-lg">
  <button
    onClick={() => setMotorRunning((prev) => !prev)}
    className={cn(
      "px-3 py-1 rounded-md font-medium transition-all",
      motorRunning
        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
        : "bg-primary text-primary-foreground hover:bg-primary/90"
    )}
  >
    {motorRunning ? "STOP" : "START"}
  </button>

  <button
    onClick={() => setRotationDirection((prev) => (prev === 1 ? -1 : 1))}
    className={cn(
      "px-3 py-1 rounded-md font-medium transition-all",
      rotationDirection === 1
        ? "bg-green-600 hover:bg-green-700 text-white"
        : "bg-amber-600 hover:bg-amber-700 text-white"
    )}
  >
    {rotationDirection === 1 ? "FORWARD" : "REVERSE"}
  </button>
</div>

            <ThemeToggle />

            <button
              onClick={() => setMaintenanceLogOpen(true)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              title="Maintenance Log"
            >
              <FileText className="w-5 h-5" />
            </button>

            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {
              theme === 'light' ? (
              <img src="/blackLogo.png" className="ml-4 w-36 h-8" alt="logo" />
            ) : (
            <img src="/logo.png" className="ml-4 w-36 h-6" alt="logo" />
          )
            }
          </div>
        </div>
      </header>

      {/* KPI Bar */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-14 z-40">
        <div className="flex items-center gap-3 px-4 py-2 overflow-x-auto">
          <KPICard
            title="Health Score"
            value={healthScore}
            unit="/100"
            status={getHealthStatus(healthScore)}
            icon={<Activity className="w-4 h-4" />}
          />
          <KPICard
            title="Motor RUL"
            value={rul.motor}
            unit="days"
            status={rul.motor < 60 ? 'critical' : rul.motor < 120 ? 'warning' : 'normal'}
            icon={<Gauge className="w-4 h-4" />}
          />
          <KPICard
            title="Gearbox RUL"
            value={rul.gearbox}
            unit="days"
            status={rul.gearbox < 50 ? 'critical' : rul.gearbox < 100 ? 'warning' : 'normal'}
            icon={<Gauge className="w-4 h-4" />}
          />
          <KPICard
            title="Active Alerts"
            value={activeAlerts}
            status={activeAlerts > 2 ? 'critical' : activeAlerts > 0 ? 'warning' : 'normal'}
            icon={<AlertTriangle className="w-4 h-4" />}
          />
          <KPICard
            title="Current Load"
            value={loadPercentage}
            unit="%"
            status={loadPercentage > 90 ? 'critical' : loadPercentage > 75 ? 'warning' : 'normal'}
            icon={<Zap className="w-4 h-4" />}
          />
          <KPICard
            title="Motor Temp"
            value={currentData.motorTemperature}
            unit="°C"
            status={
              currentData.motorTemperature > 75
                ? 'critical'
                : currentData.motorTemperature > 65
                ? 'warning'
                : 'normal'
            }
            icon={<Thermometer className="w-4 h-4" />}
          />
          <KPICard
            title="Machine Status"
            value={machineStatus}
            status={getMachineStatusColor(machineStatus)}
            icon={<Power className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 relative">
        {/* 3D Digital Twin Viewer */}
        <div className="absolute inset-0">
          <DigitalTwinViewer
            componentStatuses={componentStatuses}
            onComponentClick={handleComponentClick}
            currentData={currentData}
            motorRunning={motorRunning}
            rotationDirection={rotationDirection}
          />
        </div>

        {/* Tab Content */}
        <div className="absolute inset-0 pointer-events-none">
          {activeTab === 'condition' && (
            <ConditionMonitoringTab
              timeSeriesData={timeSeriesData}
              currentData={currentData}
              limits={limits}
            />
          )}
          {activeTab === 'predictive' && (
            <PredictiveMaintenanceTab
              currentData={currentData}
              healthScore={healthScore}
              rul={rul}
            />
          )}
          {activeTab === 'quality' && (
            <QualityControlTab
              timeSeriesData={timeSeriesData}
              currentData={currentData}
            />
          )}
          {activeTab === 'whatif' && (
            <WhatIfAnalysisTab currentData={currentData} />
          )}
        </div>
      </main>

      {/* Modals */}
      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        limits={limits}
        onUpdateLimits={setLimits}
      />

      <MaintenanceLogModal
        open={maintenanceLogOpen}
        onOpenChange={setMaintenanceLogOpen}
      />
    </div>
  );
};

export default Dashboard;
