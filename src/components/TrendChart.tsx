import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from "@/components/ui/card";
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";

export function TrendChart() {
  const [chartData, setChartData] = useState<any[]>([]);
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

          const formattedData = parsedData.map((item: any) => {
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
          
          // Only keep last 24h for this dashboard preview chart
          const limit = Date.now() - 24 * 60 * 60 * 1000;
          setChartData(formattedData.filter(p => p.timestampValue >= limit));
        }
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <Card className="p-6 bg-card border-border relative overflow-hidden h-full">
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 backdrop-blur-[2px]">
          <span className="text-sm font-medium animate-pulse">Loading trends...</span>
        </div>
      )}
      <h3 className="text-lg font-bold mb-6 relative z-20">24h Environmental Trends</h3>
      <div className="h-[300px] w-full relative z-20">
        {chartData.length === 0 && !isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data available.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '8px' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line type="monotone" dataKey="temperature" name="Temp (°C)" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#4ba2ff" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="gasLevel" name="Gas (PPM)" stroke="#ff4d4d" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
