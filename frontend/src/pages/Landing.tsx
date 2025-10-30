import { Shield, FileSearch, Scale } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-foreground"
            aria-label="Go to home"
          >
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">PolicyPal</h1>
          </button>
          
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 text-sm font-medium text-muted-foreground">
              AI-Assisted Privacy Insights
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-foreground">
              Understand and Compare Policies in Minutes
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose how you want to analyze legal documents—summarize a single policy with risk indicators or compare two policies side-by-side to spot key differences.
            </p>

            <div className="grid gap-6 md:grid-cols-2 mt-10">
              <Card className="border border-border bg-card/90 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-foreground">
                    <FileSearch className="h-7 w-7 text-primary" />
                    Summarize a Policy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-left text-muted-foreground">
                  <p>
                    Upload a PDF or enter a URL to receive a concise breakdown of the policy core sections and associated risk levels.
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Data collection practices explained</li>
                    <li>User rights and opt-out options highlighted</li>
                    <li>Risk levels surfaced with supporting details</li>
                  </ul>
                  <Button className="w-full" size="lg" onClick={() => navigate("/summarize")}>
                    Start Summarizing
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-border bg-card/90 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-foreground">
                    <Scale className="h-7 w-7 text-primary" />
                    Compare Two Policies
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-left text-muted-foreground">
                  <p>
                    Analyze two PDFs or URLs to understand how their privacy, data sharing, and user protections differ.
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Side-by-side section summaries</li>
                    <li>Key differences automatically flagged</li>
                    <li>Human-friendly recommendations for users</li>
                  </ul>
                  <Button className="w-full" size="lg" variant="secondary" onClick={() => navigate("/compare")}>
                    Compare Policies
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center space-y-6">
            <h3 className="text-2xl font-semibold text-foreground">Why PolicyPal?</h3>
            <p className="text-muted-foreground">
              PolicyPal simplifies complex legal jargon, empowering teams to evaluate digital services faster. Whether you are reviewing a single policy or comparing alternatives, our AI-assisted workflows give you structured answers without the rabbit holes.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card/60 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PolicyPal. Built for transparency and trust.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
