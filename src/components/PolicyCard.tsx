import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface PolicyCardProps {
  title: string;
  summary: string;
  riskLevel: "safe" | "caution" | "danger";
  details?: string;
}

const PolicyCard = ({ title, summary, riskLevel, details }: PolicyCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const riskConfig = {
    safe: {
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success/10",
      borderColor: "border-success/20",
      label: "Safe",
    },
    caution: {
      icon: AlertTriangle,
      color: "text-warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/20",
      label: "Caution",
    },
    danger: {
      icon: AlertCircle,
      color: "text-danger",
      bgColor: "bg-danger/10",
      borderColor: "border-danger/20",
      label: "Risk Flag",
    },
  };

  const config = riskConfig[riskLevel];
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        "transition-all duration-300 hover:shadow-lg border-l-4",
        config.borderColor
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-2xl font-bold text-foreground">{title}</CardTitle>
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full whitespace-nowrap",
              config.bgColor
            )}
          >
            <Icon className={cn("h-5 w-5", config.color)} />
            <span className={cn("font-semibold text-sm", config.color)}>
              {config.label}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-foreground leading-relaxed mb-4">{summary}</p>
        
        {details && (
          <div className="mt-4">
            <Button
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 px-0 hover:bg-transparent"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show Details
                </>
              )}
            </Button>
            
            {isExpanded && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border animate-accordion-down">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {details}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PolicyCard;
