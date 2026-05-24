import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface KpiCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  status?: "normal" | "warning" | "danger" | "critical";
  indicator?: "green" | "yellow" | "orange" | "red";
  suffix?: string;
  animateValue?: boolean;
}

export function KpiCard({ title, value, icon: Icon, status = "normal", indicator, suffix, animateValue }: KpiCardProps) {
  const getBadge = () => {
    if (status === "warning") return <Badge className="bg-primary text-primary-foreground">Warning</Badge>;
    if (status === "danger" || status === "critical") return <Badge variant="destructive">Critical</Badge>;
    return null;
  };

  const getIndicatorColor = () => {
    switch (indicator) {
      case "green": return "bg-green-500";
      case "yellow": return "bg-primary";
      case "orange": return "bg-orange-500";
      case "red": return "bg-destructive";
      default: return "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-card border-border p-6 flex flex-col justify-between h-full relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon className="w-5 h-5" />
            <h3 className="font-medium text-sm">{title}</h3>
          </div>
          {getBadge()}
        </div>

        <div className="flex items-end gap-2">
          <motion.p 
            key={animateValue ? value : "static"}
            initial={animateValue ? { scale: 0.9, opacity: 0.8 } : false}
            animate={animateValue ? { scale: 1, opacity: 1 } : false}
            className="text-4xl font-bold tracking-tight text-foreground"
          >
            {value}
          </motion.p>
          {suffix && <span className="text-muted-foreground mb-1 font-medium">{suffix}</span>}
        </div>

        {indicator && (
          <div className="absolute top-6 right-6 flex items-center gap-2">
            {indicator === "red" && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
              </span>
            )}
            {indicator !== "red" && (
              <span className={`h-3 w-3 rounded-full ${getIndicatorColor()}`} />
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
