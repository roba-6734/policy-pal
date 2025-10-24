import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, ArrowLeftRight } from "lucide-react";
import PolicyCard from "@/components/PolicyCard";
import { useEffect, useState } from "react";
import { getPolicySummary, mapPolicySummary } from "@/services/api";
import { toast } from "@/hooks/use-toast";

// Policy section structure for frontend display
interface PolicySection {
  title: string;
  summary: string;
  riskLevel: "safe" | "caution" | "danger";
  details?: string;
}

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sections, setSections] = useState<PolicySection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const stateData = (location.state as { summaryId?: string; source?: string } | null) ?? null;
  const stateSummaryId = stateData?.summaryId;
  const stateSource = stateData?.source;
  const [documentName, setDocumentName] = useState(stateSource ?? "Unknown Document");

  useEffect(() => {
    const fetchPolicySummary = async () => {
      const params = new URLSearchParams(location.search);
      const idsParam = params.get("ids");
      const querySummaryId = idsParam
        ? idsParam
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean)[0]
        : undefined;
      const targetSummaryId = stateSummaryId ?? querySummaryId;

      if (!targetSummaryId) {
        navigate("/");
        return;
      }

      setIsLoading(true);

      try {
        const response = await getPolicySummary(targetSummaryId);
        const mappedSections = mapPolicySummary(response.summary);
        setSections(mappedSections);
        setDocumentName(response.source_name || stateSource || "Unknown Document");
      } catch (error) {
        console.error("Error fetching policy summary:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load policy summary.",
          variant: "destructive",
        });
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolicySummary();
  }, [stateSummaryId, stateSource, location.search, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading policy summary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">PolicyPal</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate("/compare")}>
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Compare Policies
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                New Analysis
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Results Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Policy Summary
            </h2>
            <p className="text-lg text-muted-foreground">
              Analysis of: <span className="font-semibold text-foreground">{documentName}</span>
            </p>
          </div>

          {/* Policy Cards */}
          <div className="space-y-6 animate-slide-up">
            {sections.map((section, index) => (
              <PolicyCard
                key={index}
                title={section.title}
                summary={section.summary}
                riskLevel={section.riskLevel}
                details={section.details}
              />
            ))}
          </div>

          {/* Summary Stats */}
          <div className="mt-12 p-8 bg-card rounded-xl border border-border shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-foreground">Overall Assessment</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-success mb-1">
                  {sections.filter((s) => s.riskLevel === "safe").length}
                </div>
                <div className="text-sm text-muted-foreground">Safe Practices</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-warning mb-1">
                  {sections.filter((s) => s.riskLevel === "caution").length}
                </div>
                <div className="text-sm text-muted-foreground">Caution Areas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-danger mb-1">
                  {sections.filter((s) => s.riskLevel === "danger").length}
                </div>
                <div className="text-sm text-muted-foreground">Risk Flags</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 PolicyPal. Built for transparency and trust.</p>
        </div>
      </footer>
    </div>
  );
};

export default Results;
