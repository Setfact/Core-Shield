import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

type LogEntry = {
  id: string;
  event: string;
  type: string;
  details: string;
  timestamp: string;
};

export default function SecurityLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const logsRef = ref(db, 'logs');
    const unsubscribe = onValue(logsRef, (snapshot) => {
      setIsLoading(true);
      const data = snapshot.val();
      if (data) {
        const parsedLogs: LogEntry[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        
        // Sort descending by timestamp
        parsedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setLogs(parsedLogs);
      } else {
        setLogs([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getMappedLocation = (details: string) => {
    const lower = details?.toLowerCase() || "";
    if (lower.includes("back door")) return "Back Door";
    if (lower.includes("front door")) return "Front Door";
    return "Server Room";
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === "All") return true;
    if (filter === "Warning") return log.type === "warning";
    if (filter === "Critical") return log.type === "danger";
    return true;
  });

  const getStatusBadge = (type: string) => {
    switch (type) {
      case 'danger':
        return <Badge variant="destructive" className="font-bold">Critical</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">Warning</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">OK</Badge>;
    }
  };

  const getSensorBadge = (event: string) => {
    let sensorName = event;
    if (event === "MOTION_DETECTED") sensorName = "PIR";
    else if (event === "INTRUSION_DETECTED") sensorName = "Ultrasonic";

    return (
      <Badge variant="secondary" className="bg-sidebar-accent text-sidebar-accent-foreground">
        {sensorName}
      </Badge>
    );
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return "-";
    try {
      return format(new Date(timestamp), "dd MMM yyyy, HH:mm");
    } catch {
      return "Invalid Date";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Security Logs</h2>
          <p className="text-muted-foreground mt-1">Full activity and intrusion history.</p>
        </div>
      </div>

      <Card className="bg-card border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-sidebar/50">
          <Tabs defaultValue="All" onValueChange={setFilter} className="w-[400px]">
            <TabsList className="grid w-full grid-cols-3 bg-sidebar-accent">
              <TabsTrigger value="All" data-testid="tab-filter-all">All</TabsTrigger>
              <TabsTrigger value="Warning" data-testid="tab-filter-warning">Warning</TabsTrigger>
              <TabsTrigger value="Critical" data-testid="tab-filter-critical">Critical</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Table>
          <TableHeader className="bg-sidebar">
            <TableRow className="border-border hover:bg-sidebar">
              <TableHead className="text-muted-foreground">Time</TableHead>
              <TableHead className="text-muted-foreground">Sensor</TableHead>
              <TableHead className="text-muted-foreground">Location</TableHead>
              <TableHead className="text-muted-foreground w-1/3">Trigger Description</TableHead>
              <TableHead className="text-muted-foreground text-right">Duration</TableHead>
              <TableHead className="text-muted-foreground text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex items-center justify-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading logs...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground border-border">
                  No logs found for this filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id} className="border-border hover:bg-sidebar-accent/50 transition-colors">
                  <TableCell className="font-medium">{formatTime(log.timestamp)}</TableCell>
                  <TableCell>{getSensorBadge(log.event)}</TableCell>
                  <TableCell>{getMappedLocation(log.details)}</TableCell>
                  <TableCell className="text-muted-foreground">{log.details}</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right">{getStatusBadge(log.type)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
