import { useSensorData } from "@/store/useSensorData";
import { useSensors } from "@/hooks/useSensors";
import { useSecurity } from "@/hooks/useSecurity";
import { KpiCard } from "@/components/KpiCard";
import { TrendChart } from "@/components/TrendChart";
import { FanControl } from "@/components/FanControl";
import { SecurityLogTable } from "@/components/SecurityLogTable";
import { Thermometer, Droplets, Wind, Shield } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";
import type { SecurityLog } from "@/types/firebase";

export default function Dashboard() {
  const { alertThresholds } = useSensorData();
  const { temperature: currentTemp, humidity: currentHumidity, gasPpm: currentGas } = useSensors();
  const { logs } = useSecurity();
  const { toast } = useToast();
  const prevLogsRef = useRef<SecurityLog[]>([]);

  const frontDoorLogs = logs.filter(l => 
    l.details?.toLowerCase().includes('front door') || 
    l.event === 'INTRUSION_DETECTED'
  );
  
  const backDoorLogs = logs.filter(l => 
    l.details?.toLowerCase().includes('back door') || 
    l.event === 'MOTION_DETECTED'
  );

  const recentFrontDoor = frontDoorLogs[0];
  const recentBackDoor = backDoorLogs[0];

  const frontDoorStatus = 
    (recentFrontDoor?.type === 'danger' || recentFrontDoor?.type === 'Critical' || recentFrontDoor?.event === 'INTRUSION_DETECTED') ? 'danger' : 
    (recentFrontDoor?.type === 'warning' || recentFrontDoor?.type === 'Warning') ? 'warning' : 'safe';
    
  const backDoorStatus = 
    (recentBackDoor?.type === 'danger' || recentBackDoor?.type === 'Critical' || recentBackDoor?.event === 'INTRUSION_DETECTED') ? 'danger' : 
    (recentBackDoor?.type === 'warning' || recentBackDoor?.type === 'Warning' || recentBackDoor?.event === 'MOTION_DETECTED') ? 'warning' : 'safe';

  // Has critical logic for the alert banner
  const hasCritical = logs.some(e => e.status === 'Critical' && e.sensor === 'Ultrasonic' && (e.duration || 0) >= 15);
  const securityStatus = hasCritical ? 'Alarm' : (logs.some(e => e.status === 'Warning') ? 'Warning' : 'Safe');

  const getTempStatus = () => {
    if (currentTemp > alertThresholds.tempDanger) return "critical";
    if (currentTemp > alertThresholds.tempWarn) return "warning";
    return "normal";
  };

  const getHumidStatus = () => {
    if (currentHumidity > alertThresholds.humidDanger) return "critical";
    if (currentHumidity > alertThresholds.humidWarn) return "warning";
    return "normal";
  };

  const getGasStatus = () => {
    if (currentGas > alertThresholds.gasDanger) return "critical";
    if (currentGas > alertThresholds.gasWarn) return "warning";
    return "normal";
  };

  // Toast notification effect
  useEffect(() => {
    if (logs.length > 0 && prevLogsRef.current.length > 0) {
      const newLogs = logs.filter(
        (log) => !prevLogsRef.current.some((prevLog) => prevLog.id === log.id)
      );

      newLogs.forEach(newLog => {
        if (newLog.event === 'INTRUSION_DETECTED' || newLog.type === 'danger') {
          toast({
            title: "Front Door Intrusion!",
            description: `Movement detected at ${newLog.timestamp || newLog.time}`,
            variant: "destructive",
          });

          // Panggil Backend Golang untuk Telegram
          fetch('http://localhost:8080/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              message: `Peringatan! Terdeteksi aktivitas berbahaya (Intrusion) pada sistem.`, 
              level: 'danger' 
            })
          }).catch(err => console.error("Gagal nge-hit backend:", err));

        } else if (newLog.event === 'MOTION_DETECTED' || newLog.type === 'warning') {
          toast({
            title: "Back Door Motion",
            description: `Motion detected at ${newLog.timestamp || newLog.time}`,
            className: "bg-yellow-500 text-white border-yellow-600",
          });

          // Panggil Backend Golang untuk Telegram
          fetch('http://localhost:8080/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              message: `Peringatan: Terdeteksi gerakan mencurigakan pada sistem.`, 
              level: 'warning' 
            })
          }).catch(err => console.error("Gagal nge-hit backend:", err));
        }
      });
    }
    // Need to initialize ref if it's the first render so we don't trigger toast on load
    if (logs.length > 0) {
      prevLogsRef.current = logs;
    }
  }, [logs, toast]);

  // Environmental Edge-Triggered Telegram Alerts
  const prevTempStatusRef = useRef("normal");
  const prevGasStatusRef = useRef("normal");

  useEffect(() => {
    const tempStatus = getTempStatus();
    if (tempStatus === "critical" && prevTempStatusRef.current !== "critical") {
      fetch('http://localhost:8080/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: `🔥 BAHAYA: Suhu Server mencapai titik KRITIS (${currentTemp.toFixed(1)}°C)! Pendingin darurat diperlukan.`, 
          level: 'danger' 
        })
      }).catch(console.error);
    }
    prevTempStatusRef.current = tempStatus;
  }, [currentTemp, alertThresholds]);

  useEffect(() => {
    const gasStatus = getGasStatus();
    if (gasStatus === "critical" && prevGasStatusRef.current !== "critical") {
      fetch('http://localhost:8080/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: `☢️ BAHAYA: Kebocoran Gas ekstrim terdeteksi (${currentGas.toFixed(0)} PPM)! Segera evakuasi/periksa.`, 
          level: 'danger' 
        })
      }).catch(console.error);
    }
    prevGasStatusRef.current = gasStatus;
  }, [currentGas, alertThresholds]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <span className="text-sm text-muted-foreground flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          System Live
        </span>
      </div>

      {securityStatus === "Alarm" && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/50 text-destructive animate-pulse">
          <Shield className="h-5 w-5" />
          <AlertTitle className="text-lg font-bold">CRITICAL ALARM ACTIVATED</AlertTitle>
          <AlertDescription>
            Intrusion detected. Security protocols engaged. Review logs immediately.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Rack Temperature" 
          value={currentTemp.toFixed(1)} 
          suffix="°C"
          icon={Thermometer}
          status={getTempStatus()}
          animateValue
        />
        <KpiCard 
          title="Rack Humidity" 
          value={currentHumidity.toFixed(1)} 
          suffix="%"
          icon={Droplets}
          status={getHumidStatus()}
          animateValue
        />
        <KpiCard 
          title="Air Quality" 
          value={currentGas.toFixed(0)} 
          suffix="PPM"
          icon={Wind}
          status={getGasStatus()}
          animateValue
        />
        <Card className="bg-card border-border p-6 flex flex-col justify-between h-full relative overflow-hidden">
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <Shield className="w-5 h-5" />
            <h3 className="font-medium text-sm">Security Status</h3>
          </div>
          
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold">Front Door</span>
              <div className="flex items-center gap-2">
                {frontDoorStatus === 'danger' ? (
                   <span className="relative flex h-3 w-3">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                   </span>
                ) : frontDoorStatus === 'warning' ? (
                   <span className="h-3 w-3 rounded-full bg-yellow-500" />
                ) : (
                   <span className="h-3 w-3 rounded-full bg-green-500" />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold">Back Door</span>
              <div className="flex items-center gap-2">
                {backDoorStatus === 'danger' ? (
                   <span className="relative flex h-3 w-3">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                   </span>
                ) : backDoorStatus === 'warning' ? (
                   <span className="h-3 w-3 rounded-full bg-yellow-500" />
                ) : (
                   <span className="h-3 w-3 rounded-full bg-green-500" />
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendChart />
        </div>
        <div className="lg:col-span-1">
          <FanControl />
        </div>
      </div>

      <div className="grid grid-cols-1">
        <SecurityLogTable />
      </div>
    </div>
  );
}
