import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Results from "./pages/Results";
import Compare from "./pages/Compare";
import NotFound from "./pages/NotFound";
import { WorkspaceProvider } from "@/hooks/useWorkspace";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react"

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Analytics />
    <SpeedInsights />
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <WorkspaceProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/summarize" element={<Index />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/results" element={<Results />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </WorkspaceProvider>
    </TooltipProvider>
  </QueryClientProvider>

);

export default App;
