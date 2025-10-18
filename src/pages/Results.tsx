import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";
import PolicyCard from "@/components/PolicyCard";
import { useEffect, useState } from "react";

// Mock data structure - replace with actual API response
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
  const source = location.state?.source || "Unknown Document";

  useEffect(() => {
    // TODO: Replace with actual API call
    // const fetchPolicySummary = async () => {
    //   const response = await fetch("/api/summarize_policy", {
    //     method: "POST",
    //     body: formData,
    //   });
    //   const data = await response.json();
    //   setSections(data.sections);
    // };

    // Mock data for demonstration
    const mockSections: PolicySection[] = [
      {
        title: "Data Collection",
        summary:
          "This policy collects personal information including name, email, device identifiers, and browsing behavior. Location data is collected when using the app.",
        riskLevel: "caution",
        details:
          "The service collects: • Personal identifiers (name, email, phone) • Device information (IP address, browser type, device ID) • Usage data (pages visited, time spent, clicks) • Location data (GPS coordinates when app is active) • Cookies and tracking technologies for advertising purposes.",
      },
      {
        title: "User Rights",
        summary:
          "Users have the right to access, correct, and delete their data. Requests must be submitted via email and will be processed within 30 days.",
        riskLevel: "safe",
        details:
          "Your rights include: • Right to access your data • Right to correction of inaccurate data • Right to deletion (right to be forgotten) • Right to data portability • Right to object to processing • Right to withdraw consent at any time. Submit requests to privacy@example.com with subject line 'Data Rights Request'.",
      },
      {
        title: "Data Sharing",
        summary:
          "Your data is shared with third-party analytics providers, advertising partners, and may be disclosed to law enforcement upon request without user notification.",
        riskLevel: "danger",
        details:
          "Data is shared with: • Analytics providers (Google Analytics, Mixpanel) • Advertising networks for targeted ads • Payment processors for transactions • Service providers for infrastructure • Law enforcement when legally required • Business partners for co-marketing. No user notification is provided before law enforcement disclosure.",
      },
      {
        title: "Opt-Out Options",
        summary:
          "Users can opt out of marketing emails but cannot opt out of service-related communications. Third-party tracking can be limited through browser settings.",
        riskLevel: "caution",
        details:
          "Available opt-outs: • Marketing emails: Click unsubscribe link • Cookies: Use browser privacy settings • Personalized ads: Visit NAI or DAA opt-out pages • Analytics: Install browser extensions like Privacy Badger. Note: Service emails (account updates, security alerts) cannot be disabled.",
      },
      {
        title: "Arbitration Clause",
        summary:
          "By using this service, you agree to binding arbitration and waive your right to a jury trial or participate in class action lawsuits.",
        riskLevel: "danger",
        details:
          "Dispute resolution terms: • All disputes must be resolved through binding arbitration • No jury trials permitted • No class action lawsuits allowed • Individual arbitration only • Arbitration takes place in [Company State] • You have 30 days from first use to opt out by sending written notice • Arbitration costs split between parties.",
      },
    ];

    setSections(mockSections);
  }, []);

  if (!location.state) {
    // Redirect if accessed directly without data
    useEffect(() => {
      navigate("/");
    }, [navigate]);
    return null;
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
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              New Analysis
            </Button>
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
              Analysis of: <span className="font-semibold text-foreground">{source}</span>
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
