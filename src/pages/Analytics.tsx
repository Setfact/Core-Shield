import { useState, useEffect, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";

type ChartPoint = {
  time: string;
  timestampValue: number;
  temperature: number;
  humidity: number;
  gasLevel: number;
};

export default function Analytics() {
  const [rawData, setRawData] = useState<ChartPoint[]>([]);
  const [timeRange, setTimeRange] = useState<"1h" | "6h" | "24h">("24h");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const historyRef = ref(db, 'telemetry/history');
        const snapshot = await get(historyRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          let parsedData: any[] = [];
          
          if (Array.isArray(data)) {
            parsedData = data.filter(item => item !== null);
          } else {
            parsedData = Object.values(data).filter(item => item !== null);
          }

          const formattedData: ChartPoint[] = parsedData.map((item: any) => {
            const date = new Date(item.timestamp);
            return {
              time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              timestampValue: date.getTime(),
              temperature: typeof item.temperature === 'number' ? item.temperature : 0,
              humidity: typeof item.humidity === 'number' ? item.humidity : 0,
              gasLevel: typeof item.gasPpm === 'number' ? item.gasPpm : 0,
            };
          });

          // Sort ascending based on timestamp
          formattedData.sort((a, b) => a.timestampValue - b.timestampValue);
          setRawData(formattedData);
        }
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const chartData = useMemo(() => {
    const now = Date.now();
    let limit = now;
    
    if (timeRange === "1h") limit = now - 1 * 60 * 60 * 1000;
    else if (timeRange === "6h") limit = now - 6 * 60 * 60 * 1000;
    else if (timeRange === "24h") limit = now - 24 * 60 * 60 * 1000;

    return rawData.filter(point => point.timestampValue >= limit);
  }, [rawData, timeRange]);

  const minTemp = chartData.length > 0 ? Math.min(...chartData.map(p => p.temperature)) : 0;
  const maxTemp = chartData.length > 0 ? Math.max(...chartData.map(p => p.temperature)) : 0;
  const avgTemp = chartData.length > 0 ? chartData.reduce((a, b) => a + b.temperature, 0) / chartData.length : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sensor Analytics</h2>
          <p className="text-muted-foreground mt-1">Detailed historical performance of rack sensors.</p>
        </div>
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)} className="w-[300px]">
          <TabsList className="grid w-full grid-cols-3 bg-sidebar">
            <TabsTrigger value="1h" data-testid="tab-1h">1h</TabsTrigger>
            <TabsTrigger value="6h" data-testid="tab-6h">6h</TabsTrigger>
            <TabsTrigger value="24h" data-testid="tab-24h">24h</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-6">
        <Card className="p-6 bg-card border-border relative overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 backdrop-blur-[2px]">
              <span className="text-sm font-medium animate-pulse">Loading history...</span>
            </div>
          )}
          <div className="flex justify-between items-center mb-6 relative z-20">
            <h3 className="text-lg font-bold">Temperature & Humidity</h3>
            <div className="flex gap-4 text-sm">
              <span className="text-muted-foreground">Min Temp: <span className="text-foreground font-medium">{minTemp.toFixed(1)}°C</span></span>
              <span className="text-muted-foreground">Max Temp: <span className="text-primary font-medium">{maxTemp.toFixed(1)}°C</span></span>
              <span className="text-muted-foreground">Avg Temp: <span className="text-foreground font-medium">{avgTemp.toFixed(1)}°C</span></span>
            </div>
          </div>
          <div className="h-[350px] w-full relative z-20">
            {chartData.length === 0 && !isLoading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data available for this time range.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorHumid" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ba2ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4ba2ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} minTickGap={30} />
                  <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '8px' }}
                  />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="temperature" name="Temp (°C)" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorTemp)" animationDuration={500} />
                  <Area yAxisId="right" type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#4ba2ff" fillOpacity={1} fill="url(#colorHumid)" animationDuration={500} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-card border-border relative overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 backdrop-blur-[2px]">
              <span className="text-sm font-medium animate-pulse">Loading history...</span>
            </div>
          )}
          <h3 className="text-lg font-bold mb-6 relative z-20">Gas Level (PPM)</h3>
          <div className="h-[250px] w-full relative z-20">
            {chartData.length === 0 && !isLoading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data available for this time range.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff4d4d" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ff4d4d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} minTickGap={30} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '8px' }}
                  />
                  <Area type="monotone" dataKey="gasLevel" name="Gas (PPM)" stroke="#ff4d4d" fillOpacity={1} fill="url(#colorGas)" animationDuration={500} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
