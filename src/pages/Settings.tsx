import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSensorData } from "@/store/useSensorData";
import { Save, BellRing } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { ref, get, set } from "firebase/database";
import { db } from "@/lib/firebase";

export default function Settings() {
  const { alertThresholds, updateThresholds } = useSensorData();
  const { toast } = useToast();

  useEffect(() => {
    const thresholdsRef = ref(db, 'settings/thresholds');
    get(thresholdsRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        updateThresholds({
          tempWarn: data.tempWarning !== undefined ? data.tempWarning : 35,
          tempDanger: data.tempDanger !== undefined ? data.tempDanger : 42,
          gasWarn: data.gasWarning !== undefined ? data.gasWarning : 300,
          gasDanger: data.gasDanger !== undefined ? data.gasDanger : 600
        });
      }
    }).catch((error) => {
      console.error("Failed to fetch thresholds:", error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    try {
      const thresholdsRef = ref(db, 'settings/thresholds');
      await set(thresholdsRef, {
        tempWarning: alertThresholds.tempWarn,
        tempDanger: alertThresholds.tempDanger,
        gasWarning: alertThresholds.gasWarn,
        gasDanger: alertThresholds.gasDanger
      });

      toast({
        title: "Settings Saved",
        description: "Alert thresholds have been updated successfully to Firebase.",
      });
    } catch (error) {
      console.error("Failed to save thresholds:", error);
      toast({
        title: "Error Saving Settings",
        description: "Failed to update alert thresholds in Firebase.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
        <p className="text-muted-foreground mt-1">Configure alerts, thresholds, and integrations.</p>
      </div>

      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-6">
          <BellRing className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-bold">Alert Thresholds</h3>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between">
              <Label className="text-base font-bold">Temperature Warning (°C)</Label>
              <span className="text-primary font-bold">{alertThresholds.tempWarn}°C</span>
            </div>
            <Slider 
              value={[alertThresholds.tempWarn]} 
              min={20} max={50} step={1}
              onValueChange={(v) => updateThresholds({ tempWarn: v[0] })}
              data-testid="slider-temp-warn"
            />
            <p className="text-sm text-muted-foreground">Triggers warning status on dashboard.</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <Label className="text-base font-bold text-destructive">Temperature Danger (°C)</Label>
              <span className="text-destructive font-bold">{alertThresholds.tempDanger}°C</span>
            </div>
            <Slider 
              value={[alertThresholds.tempDanger]} 
              min={30} max={60} step={1}
              onValueChange={(v) => updateThresholds({ tempDanger: v[0] })}
              className="[&_[role=slider]]:border-destructive [&_[role=slider]]:bg-destructive"
              data-testid="slider-temp-danger"
            />
            <p className="text-sm text-muted-foreground">Triggers critical alarm and full cooling.</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <Label className="text-base font-bold">Gas Level Warning (PPM)</Label>
              <span className="text-primary font-bold">{alertThresholds.gasWarn} PPM</span>
            </div>
            <Slider 
              value={[alertThresholds.gasWarn]} 
              min={0} max={1000} step={10}
              onValueChange={(v) => updateThresholds({ gasWarn: v[0] })}
              data-testid="slider-gas-warn"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <Label className="text-base font-bold text-destructive">Gas Level Danger (PPM)</Label>
              <span className="text-destructive font-bold">{alertThresholds.gasDanger} PPM</span>
            </div>
            <Slider 
              value={[alertThresholds.gasDanger]} 
              min={100} max={2000} step={10}
              onValueChange={(v) => updateThresholds({ gasDanger: v[0] })}
              className="[&_[role=slider]]:border-destructive [&_[role=slider]]:bg-destructive"
              data-testid="slider-gas-danger"
            />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex justify-end">
          <Button onClick={handleSave} className="bg-primary text-primary-foreground font-bold px-8" data-testid="btn-save-settings">
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </Card>



    </div>
  );
}
