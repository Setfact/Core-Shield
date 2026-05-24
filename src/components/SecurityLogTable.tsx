import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ShieldAlert, Activity, Camera, Loader2 } from "lucide-react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

type LogEntry = {
  id: string;
  event: string;
  type: string;
  details: string;
  timestamp: string;
};

export function SecurityLogTable() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const recentEvents = logs.slice(0, 5);

  const getStatusBadge = (type: string) => {
    switch (type) {
      case 'danger':
        return <Badge variant="destructive" className="font-bold">Critical</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600 border-transparent">Warning</Badge>;
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

  const getMappedLocation = (details: string) => {
    const lower = details?.toLowerCase() || "";
    if (lower.includes("back door")) return "Back Door";
    if (lower.includes("front door")) return "Front Door";
    return "Server Room";
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return "-";
    try {
      return format(new Date(timestamp), "dd MMM yyyy, HH:mm");
    } catch {
      return "Invalid Date";
    }
  };

  const getRowStyle = (type?: string) => {
    if (type === 'danger') return "bg-red-500/10 hover:bg-red-500/20 border-red-500/20";
    if (type === 'warning') return "bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/20";
    return "hover:bg-sidebar-accent/50 border-border";
  };

  const getIcon = (event?: string) => {
    if (event === 'INTRUSION_DETECTED') return <Camera className="w-4 h-4 text-destructive" />;
    if (event === 'MOTION_DETECTED') return <Activity className="w-4 h-4 text-yellow-500" />;
    return <ShieldAlert className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-primary" />
          Recent Security Logs
        </h3>
        <Link href="/security" className="text-sm text-primary hover:underline" data-testid="link-view-all-logs">
          View All
        </Link>
      </div>

      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-sidebar">
            <TableRow className="border-border hover:bg-sidebar">
              <TableHead className="text-muted-foreground">Time</TableHead>
              <TableHead className="text-muted-foreground">Sensor</TableHead>
              <TableHead className="text-muted-foreground">Location</TableHead>
              <TableHead className="text-muted-foreground w-1/3">Trigger Description</TableHead>
              <TableHead className="text-muted-foreground text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex items-center justify-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Loading logs...
                  </div>
                </TableCell>
              </TableRow>
            ) : recentEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground border-border">
                  No recent logs found.
                </TableCell>
              </TableRow>
            ) : (
              recentEvents.map((log) => (
                <TableRow key={log.id} className={`transition-colors border-border ${getRowStyle(log.type)}`}>
                  <TableCell className="font-medium">{formatTime(log.timestamp)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getIcon(log.event)}
                      {getSensorBadge(log.event)}
                    </div>
                  </TableCell>
                  <TableCell>{getMappedLocation(log.details)}</TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-[200px]">{log.details}</TableCell>
                  <TableCell className="text-right">{getStatusBadge(log.type)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
