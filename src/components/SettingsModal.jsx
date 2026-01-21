// SettingsAndMaintenanceModals.jsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { maintenanceLogs } from '@/data/mockData';
import { X, Save, AlertCircle, Clock, Wrench, Cog } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SettingsModal = ({ open, onOpenChange, limits, onUpdateLimits }) => {
  const [localLimits, setLocalLimits] = useState(limits);
  const [activeTab, setActiveTab] = useState('limits');

  const handleLimitChange = (parameter, field, value) => {
    setLocalLimits(prev => 
      prev.map(limit => 
        limit.parameter === parameter 
          ? { ...limit, [field]: parseFloat(value) || 0 }
          : limit
      )
    );
  };

  const handleSave = () => {
    onUpdateLimits(localLimits);
    onOpenChange(false);
  };

  const formatParameterName = (param) => {
    return param
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold">Settings</DialogTitle>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="w-5 h-5" />
          </Button>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Cog className="w-4 h-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="limits" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Limits
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="mt-4">
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Refresh Interval (seconds)</Label>
                  <Input type="number" defaultValue="2" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Data Retention (days)</Label>
                  <Input type="number" defaultValue="30" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Alert Email</Label>
                  <Input type="email" placeholder="alerts@company.com" className="bg-secondary border-border" />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="limits" className="mt-4">
            <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3">
              {localLimits.map((limit) => (
                <div key={limit.parameter} className="grid grid-cols-3 gap-4 items-center py-2 border-b border-border/50">
                  <Label className="text-sm text-muted-foreground">
                    {formatParameterName(limit.parameter)}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground w-8">Min</Label>
                    <Input
                      type="number"
                      value={limit.minimum}
                      onChange={(e) => handleLimitChange(limit.parameter, 'minimum', e.target.value)}
                      className="bg-secondary border-border h-8 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground w-8">Max</Label>
                    <Input
                      type="number"
                      value={limit.maximum}
                      onChange={(e) => handleLimitChange(limit.parameter, 'maximum', e.target.value)}
                      className="bg-secondary border-border h-8 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const MaintenanceLogModal = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            Maintenance Log
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Issue Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action Taken</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Component</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Downtime</th>
              </tr>
            </thead>
            <tbody>
              {maintenanceLogs.map((log, index) => (
                <tr 
                  key={index} 
                  className={cn(
                    "border-b border-border/50 hover:bg-secondary/30 transition-colors",
                    index % 2 === 0 ? 'bg-transparent' : 'bg-secondary/10'
                  )}
                >
                  <td className="px-4 py-3 font-mono text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {log.date}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2 py-1 rounded text-xs",
                      log.issueType === 'Bearing Wear' || log.issueType === 'Overheating' 
                        ? 'bg-status-critical/20 text-status-critical'
                        : log.issueType === 'High Vibration' 
                          ? 'bg-status-warning/20 text-status-warning'
                          : 'bg-primary/20 text-primary'
                    )}>
                      {log.issueType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground">{log.actionTaken}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-secondary rounded text-xs">{log.component}</span>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <span className={cn(
                      log.downtime > 60 ? 'text-status-critical' : 
                      log.downtime > 30 ? 'text-status-warning' : 'text-status-normal'
                    )}>
                      {log.downtime} min
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Total Records: {maintenanceLogs.length}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};