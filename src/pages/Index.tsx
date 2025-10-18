import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUp, Link as LinkIcon, Shield, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import heroBg from "@/assets/hero-bg.jpg";

const Index = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    
    if (!file && !url) {
      toast({
        title: "Missing input",
        description: "Please provide a PDF file or URL.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Replace with actual API call
      // const formData = new FormData();
      // if (file) {
      //   formData.append("file", file);
      // } else {
      //   formData.append("url", url);
      // }
      // const response = await fetch("/api/summarize_policy", {
      //   method: "POST",
      //   body: formData,
      // });
      // const data = await response.json();

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Navigate to results page with mock data
      navigate("/results", {
        state: {
          source: file ? file.name : url,
        },
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process policy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">PolicyPal</h1>
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
                  <div className="mt-2 relative">
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
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full text-lg h-14 font-semibold"
                  disabled={isLoading || (!file && !url)}
                >
                  {isLoading ? (
                    <>
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Analyzing Policy...
                    </>
                  ) : (
                    <>
                      <FileUp className="mr-2 h-5 w-5" />
                      Summarize Policy
                    </>
                  )}
                </Button>
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
