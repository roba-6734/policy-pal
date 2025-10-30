import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUp, Link as LinkIcon, Shield, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import heroBg from "@/assets/hero-bg.jpg";
import { summarizePolicyFromFile, summarizePolicyFromUrl } from "@/services/api";
import { useWorkspace } from "@/hooks/useWorkspace";
import { cn } from "@/lib/utils";

const Index = () => {
  const navigate = useNavigate();
  const { open, ensureLoaded, setActive } = useWorkspace();
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [queue, setQueue] = useState<Array<{ type: "file" | "url"; value: File | string; id: string }>>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  const canAnalyze = useMemo(() => queue.length > 0 || !!file || !!url, [queue.length, file, url]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setUrl(""); // Clear URL when file is selected
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !url && queue.length === 0) {
      toast({
        title: "Missing input",
        description: "Please provide a PDF file or URL.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    const work: Array<{ type: "file" | "url"; value: File | string }> = [];
    if (file) work.push({ type: "file", value: file });
    if (url) work.push({ type: "url", value: url });
    if (queue.length) work.push(...queue.map(({ type, value }) => ({ type, value })));
    const producedIds: string[] = [];
    try {
      for (const item of work) {
        try {
          const resp = item.type === "file"
            ? await summarizePolicyFromFile(item.value as File)
            : await summarizePolicyFromUrl(item.value as string);
          producedIds.push(resp.summary_id);
        } catch (err) {
          console.error("Item failed:", err);
          toast({
            title: "Item failed",
            description: err instanceof Error ? err.message : "Failed to process one item.",
            variant: "destructive",
          });
        }
      }
      if (producedIds.length) {
        setCompletedIds(producedIds);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files || []);
    const pdfs = files.filter((f) => f.type === "application/pdf");
    if (pdfs.length === 0) {
      toast({ title: "No PDFs detected", description: "Please drop PDF files only.", variant: "destructive" });
      return;
    }
    setQueue((prev) => [
      ...prev,
      ...pdfs.map((f) => ({ type: "file" as const, value: f, id: crypto.randomUUID() }))
    ]);
    setUrl("");
    setFile(null);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const clearQueueItem = (id: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <button
                type="button"
                className="text-2xl font-bold text-foreground bg-transparent border-none cursor-pointer p-0 hover:underline"
                onClick={() => navigate("/")}
                style={{ font: "inherit" }}
                aria-label="Go to home"
              >
               <h1> PolicyPal</h1>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate("/")}>
                Home
              </Button>
              <Button variant="outline" onClick={() => navigate("/compare")}>
                Compare Policies
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
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
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Understand Policies at a Glance
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12">
              Upload any Terms of Service or Privacy Policy and get an instant,
              easy-to-understand summary with risk indicators.
            </p>

            {/* Upload Form */}
            <div className="bg-card rounded-2xl shadow-lg p-8 md:p-12 animate-slide-up border border-border">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* File Upload */}
                <div className="text-left">
                  <Label htmlFor="file-upload" className="text-base font-semibold">
                    Upload PDF Document
                  </Label>
                  <div
                    className={cn(
                      "mt-2 relative rounded-lg border-2 border-dashed border-border p-6 transition-colors",
                      dragActive ? "border-primary bg-primary/5" : ""
                    )}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                  >
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer hover:file:bg-primary/90"
                    />
                    {file && (
                      <p className="mt-2 text-sm text-success flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        {file.name}
                      </p>
                    )}
                    {queue.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {queue.map((q) => (
                          <div key={q.id} className="flex items-center justify-between text-sm text-foreground/90">
                            <span>{q.type === "file" ? (q.value as File).name : (q.value as string)}</span>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => clearQueueItem(q.id)}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 border-t border-border" />
                  <span className="text-sm text-muted-foreground font-medium">OR</span>
                  <div className="flex-1 border-t border-border" />
                </div>

                {/* URL Input */}
                <div className="text-left">
                  <Label htmlFor="url-input" className="text-base font-semibold">
                    Enter Policy URL
                  </Label>
                  <div className="mt-2 flex gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="url-input"
                        type="url"
                        placeholder="https://example.com/privacy-policy"
                        value={url}
                        onChange={(e) => {
                          setUrl(e.target.value);
                          if (e.target.value) setFile(null); // Clear file when URL is entered
                        }}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (!url) return;
                        try {
                          new URL(url);
                        } catch {
                          toast({ title: "Invalid URL", description: "Please enter a valid URL.", variant: "destructive" });
                          return;
                        }
                        setQueue((prev) => [...prev, { type: "url", value: url, id: crypto.randomUUID() }]);
                        setUrl("");
                        setFile(null);
                      }}
                    >
                      Queue URL
                    </Button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full text-lg h-14 font-semibold"
                  disabled={isLoading || !canAnalyze}
                >
                  {isLoading ? (
                    <>
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <FileUp className="mr-2 h-5 w-5" />
                      Analyze
                    </>
                  )}
                </Button>

                {completedIds.length > 0 && (
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4 rounded-lg border border-border bg-muted/30">
                    <p className="text-sm text-foreground">
                      {completedIds.length} item(s) analyzed successfully.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={async () => {
                          if (completedIds.length === 0) return;
                          open(completedIds);
                          try {
                            await ensureLoaded(completedIds);
                          } catch (error) {
                            console.error("Failed to preload workspace summaries:", error);
                            toast({
                              title: "Workspace error",
                              description:
                                error instanceof Error
                                  ? error.message
                                  : "We couldn't load the summaries into the workspace.",
                              variant: "destructive",
                            });
                          }
                          setActive(completedIds[0]);
                          navigate(`/results?ids=${encodeURIComponent(completedIds.join(","))}`);
                        }}
                      >
                        Open in workspace
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCompletedIds([])}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-card rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-4">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Safe Practices</h3>
              <p className="text-muted-foreground">
                Instantly identify policies with user-friendly terms and strong privacy
                protections.
              </p>
            </div>

            <div className="text-center p-6 bg-card rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-warning/10 rounded-full mb-4">
                <AlertCircle className="h-8 w-8 text-warning" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Caution Areas</h3>
              <p className="text-muted-foreground">
                Get alerts on clauses that require attention, like broad data sharing or
                limited opt-outs.
              </p>
            </div>

            <div className="text-center p-6 bg-card rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-danger/10 rounded-full mb-4">
                <Shield className="h-8 w-8 text-danger" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Risk Flags</h3>
              <p className="text-muted-foreground">
                Spot serious concerns like mandatory arbitration or aggressive data
                collection practices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 PolicyPal. Built for transparency and trust.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
