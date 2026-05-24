import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useActuator } from "@/hooks/useActuator";
import { Fan, Power, PowerOff } from "lucide-react";

export function FanControl() {
  const { fanData, setFanMode, setFanState } = useActuator();
  const { mode: fanMode, state: fanManualState, speed: fanSpeed } = fanData;

  return (
    <Card className="p-6 bg-card border-border h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Fan className={`w-5 h-5 ${fanSpeed > 0 ? 'animate-spin text-primary' : 'text-muted-foreground'}`} style={{ animationDuration: `${3 - (fanSpeed / 100) * 2.5}s` }} />
          <h3 className="text-lg font-bold">Cooling System</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Manual</span>
          <Switch 
            checked={fanMode === 'auto'} 
            onCheckedChange={(c) => setFanMode(c ? 'auto' : 'manual')}
            data-testid="switch-fan-mode"
          />
          <span className="text-sm font-medium">Auto</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center pt-2">
        {fanMode === 'auto' && (
          <div className="bg-sidebar-accent/50 text-sm p-4 rounded-lg text-center text-muted-foreground border border-sidebar-border w-full mb-8">
            Auto-regulating based on rack temperature.
          </div>
        )}

        <div className="flex w-full gap-5">
          <Button 
            variant={fanManualState === 'on' ? 'default' : 'outline'}
            className={`flex-1 h-24 text-lg font-bold transition-all duration-300 rounded-2xl ${fanManualState === 'on' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]' : 'border-border text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100'}`}
            onClick={() => setFanState('on')}
            disabled={fanMode === 'auto'}
            data-testid="btn-fan-on"
          >
            <Power className="w-7 h-7 mr-3" />
            POWER ON
          </Button>
          <Button 
            variant={fanManualState === 'off' ? 'destructive' : 'outline'}
            className={`flex-1 h-24 text-lg font-bold transition-all duration-300 rounded-2xl ${fanManualState === 'off' ? 'shadow-lg shadow-destructive/25 scale-[1.02]' : 'border-border text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100'}`}
            onClick={() => setFanState('off')}
            disabled={fanMode === 'auto'}
            data-testid="btn-fan-off"
          >
            <PowerOff className="w-7 h-7 mr-3" />
            POWER OFF
          </Button>
        </div>
      </div>
    </Card>
  );
}
