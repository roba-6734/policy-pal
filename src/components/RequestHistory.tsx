import { formatDistanceToNow } from "date-fns";
import { Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GetSummaryResponse } from "@/services/api";

interface RequestHistoryProps {
  items: GetSummaryResponse[];
  isLoading?: boolean;
  onOpen: (id: string) => void;
  onRefresh?: () => void;
}

export const RequestHistory: React.FC<RequestHistoryProps> = ({ items, isLoading, onOpen, onRefresh }) => {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-semibold">Recent Summaries</CardTitle>
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
            Refresh
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, idx) => (
              <Skeleton key={idx} className="h-16 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-6">
            No summaries yet. Start by analyzing a policy to populate your history.
          </div>
        ) : (
          <ScrollArea className="h-[320px] pr-4">
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.summary_id}
                  className="flex items-start justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <FileText className="h-4 w-4 text-primary" />
                      <span>{item.source_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => onOpen(item.summary_id)}>
                    Open
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default RequestHistory;
