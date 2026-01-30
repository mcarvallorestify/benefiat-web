import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  onClick?: () => void;
}

export function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "bg-primary/10 text-primary",
  onClick,
}: StatsCardProps) {
  return (
    <div 
      className={cn(
        "stat-card animate-fade-in",
        onClick && "cursor-pointer hover:shadow-lg transition-shadow"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
          {change && (
            <p
              className={cn(
                "text-sm mt-2 font-medium",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", iconColor)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
