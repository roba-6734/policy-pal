import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Scale, ArrowLeftRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import heroBg from "@/assets/hero-bg.jpg";
import {
  ComparePoliciesResponse,
  comparePoliciesFromFiles,
  comparePoliciesFromUrls,
  mapPolicyComparison,
} from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ComparisonMode = "files" | "urls";

type ComparisonSection = {
  title: string;
  policy1_summary: string;
  policy2_summary: string;
  key_differences: string;
  recommendation: string;
};

type ComparisonResult = {
  comparisonId: string;
  policy1Name: string;
  policy2Name: string;
  createdAt: string;
  sections: ComparisonSection[];
};

const Compare = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ComparisonMode>("files");
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [urlA, setUrlA] = useState("");
  const [urlB, setUrlB] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);

  const isReady = useMemo(() => {
    if (mode === "files") {
      return !!fileA && !!fileB;
    }
    return urlA.trim().length > 0 && urlB.trim().length > 0;
  }, [fileA, fileB, urlA, urlB, mode]);

  const resetState = () => {
    setFileA(null);
    setFileB(null);
    setUrlA("");
    setUrlB("");
    setResult(null);
  };

  const handleFilesSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fileA || !fileB) {
      toast({
        title: "Missing files",
        description: "Upload two PDF documents to compare.",
        variant: "destructive",
      });
      return;
    }
    if (fileA.type !== "application/pdf" || fileB.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Only PDF files are supported for comparison.",
        variant: "destructive",
      });
      return;
    }
    await runComparison(async () => comparePoliciesFromFiles(fileA, fileB));
  };

  const handleUrlsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!urlA.trim() || !urlB.trim()) {
      toast({
        title: "Missing URLs",
        description: "Enter two policy URLs to compare.",
        variant: "destructive",
      });
      return;
    }
    try {
      new URL(urlA);
      new URL(urlB);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Provide valid URLs beginning with http or https.",
        variant: "destructive",
      });
      return;
    }
    await runComparison(async () => comparePoliciesFromUrls(urlA.trim(), urlB.trim()));
  };

  const runComparison = async (work: () => Promise<ComparePoliciesResponse>) => {
    setIsLoading(true);
    try {
      const response = await work();
      const sections = mapPolicyComparison(response.comparison).map((section) => ({
        title: section.title,
        policy1_summary: section.policy1_summary,
        policy2_summary: section.policy2_summary,
        key_differences: section.key_differences,
        recommendation: section.recommendation,
      }));
      setResult({
        comparisonId: response.comparison_id,
        policy1Name: response.policy1_name,
        policy2Name: response.policy2_name,
        createdAt: response.created_at,
        sections,
      });
      toast({
        title: "Comparison ready",
        description: "Review the differences between both policies below.",
      });
    } catch (error) {
      console.error("Policy comparison failed:", error);
      toast({
        title: "Comparison failed",
        description: error instanceof Error ? error.message : "Unable to compare the provided policies.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-foreground"
            >
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">PolicyPal</h1>
            </button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate("/")}>
                New Analysis
              </Button>
            </div>
          </div>
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
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-5xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 text-sm font-medium text-muted-foreground mb-6">
              <Scale className="h-4 w-4 text-primary" />
              Compare Policy Documents
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Spot the Differences Between Two Policies
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-10">
              Upload two PDFs or provide URLs to see how their privacy, data sharing, and user rights language compares.
            </p>

            <Card className="border border-border bg-card/80 text-left shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-foreground flex items-center gap-2">
                  <ArrowLeftRight className="h-6 w-6 text-primary" />
                  Choose how you want to compare
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={mode}
                  onValueChange={(value) => {
                    setMode(value as ComparisonMode);
                    setResult(null);
                  }}
                  className="w-full"
                >
                  <TabsList className="w-full justify-start rounded-lg bg-muted/60 mb-6">
                    <TabsTrigger value="files" className="flex-1">
                      Upload PDFs
                    </TabsTrigger>
                    <TabsTrigger value="urls" className="flex-1">
                      Enter URLs
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="files">
                    <form onSubmit={handleFilesSubmit} className="space-y-6">
                      <div>
                        <Label htmlFor="fileA">First policy document</Label>
                        <Input
                          id="fileA"
                          type="file"
                          accept=".pdf"
                          disabled={isLoading}
                          onChange={(event) => {
                            const selected = event.target.files?.[0] ?? null;
                            if (selected && selected.type !== "application/pdf") {
                              toast({
                                title: "Invalid file",
                                description: "Please select a PDF document.",
                                variant: "destructive",
                              });
                              event.target.value = "";
                              return;
                            }
                            setFileA(selected);
                          }}
                        />
                        {fileA && (
                          <p className="mt-2 text-sm text-success">
                            Selected: {fileA.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="fileB">Second policy document</Label>
                        <Input
                          id="fileB"
                          type="file"
                          accept=".pdf"
                          disabled={isLoading}
                          onChange={(event) => {
                            const selected = event.target.files?.[0] ?? null;
                            if (selected && selected.type !== "application/pdf") {
                              toast({
                                title: "Invalid file",
                                description: "Please select a PDF document.",
                                variant: "destructive",
                              });
                              event.target.value = "";
                              return;
                            }
                            setFileB(selected);
                          }}
                        />
                        {fileB && (
                          <p className="mt-2 text-sm text-success">
                            Selected: {fileB.name}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border border-dashed border-border rounded-lg px-4 py-3 text-sm text-muted-foreground bg-muted/40">
                        <p>
                          We only support PDF documents right now. Files stay on your device until you submit.
                        </p>
                        <Button
                          type="submit"
                          size="lg"
                          className="md:w-auto w-full"
                          disabled={!isReady || isLoading}
                        >
                          {isLoading ? (
                            <>
                              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Comparing...
                            </>
                          ) : (
                            "Compare PDFs"
                          )}
                        </Button>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="urls">
                    <form onSubmit={handleUrlsSubmit} className="space-y-6">
                      <div>
                        <Label htmlFor="urlA">First policy URL</Label>
                        <Input
                          id="urlA"
                          type="url"
                          placeholder="https://example.com/privacy"
                          value={urlA}
                          disabled={isLoading}
                          onChange={(event) => setUrlA(event.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="urlB">Second policy URL</Label>
                        <Input
                          id="urlB"
                          type="url"
                          placeholder="https://example.com/terms"
                          value={urlB}
                          disabled={isLoading}
                          onChange={(event) => setUrlB(event.target.value)}
                        />
                      </div>

                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border border-dashed border-border rounded-lg px-4 py-3 text-sm text-muted-foreground bg-muted/40">
                        <p>
                          We will fetch both pages, analyze the text content, and highlight notable differences for you.
                        </p>
                        <Button
                          type="submit"
                          size="lg"
                          className="md:w-auto w-full"
                          disabled={!isReady || isLoading}
                        >
                          {isLoading ? (
                            <>
                              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Comparing...
                            </>
                          ) : (
                            "Compare URLs"
                          )}
                        </Button>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {result && (
        <section className="container mx-auto px-4 pb-16">
          <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">
            <Card className="border border-border bg-card/80">
              <CardHeader>
                <CardTitle className="flex flex-col gap-2 text-2xl text-foreground md:flex-row md:items-center md:gap-4">
                  <span className="font-semibold">{result.policy1Name}</span>
                  <ArrowLeftRight className="hidden h-6 w-6 text-primary md:block" />
                  <span className="font-semibold">{result.policy2Name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between text-sm text-muted-foreground">
                <div>
                  Comparison ID: <span className="font-medium text-foreground">{result.comparisonId}</span>
                </div>
                <div>
                  Generated on{" "}
                  <span className="font-medium text-foreground">
                    {new Date(result.createdAt).toLocaleString()}
                  </span>
                </div>
                <Button variant="outline" onClick={resetState}>
                  Start a new comparison
                </Button>
              </CardContent>
            </Card>

            {result.sections.map((section) => (
              <Card key={section.title} className="border border-border bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-foreground">{section.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                      <p className="text-sm font-semibold text-foreground mb-1">{result.policy1Name}</p>
                      <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                        {section.policy1_summary || "No summary available."}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                      <p className="text-sm font-semibold text-foreground mb-1">{result.policy2Name}</p>
                      <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                        {section.policy2_summary || "No summary available."}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
                    <div className="rounded-lg border border-border bg-muted/40 p-4">
                      <h4 className="text-sm font-semibold text-foreground mb-2">Key differences</h4>
                      <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                        {section.key_differences || "No major differences detected."}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "rounded-lg border-l-4 border-primary/60 bg-primary/10 p-4 text-left",
                        "flex flex-col justify-between"
                      )}
                    >
                      <h4 className="text-sm font-semibold text-primary mb-2">Recommendation</h4>
                      <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                        {section.recommendation || "No recommendation provided."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <footer className="border-t border-border bg-card/50 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 PolicyPal. Built for transparency and trust.</p>
        </div>
      </footer>
    </div>
  );
};

export default Compare;
