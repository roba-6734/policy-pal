/**
 * API service for communicating with the PolicyPal backend
 */

const BASE_URL = "http://localhost:8000";

// Types matching the backend models
export type RiskLevel = "green" | "yellow" | "red";

export interface PolicySection {
  summary: string;
  risk: RiskLevel;
  details?: string;
}

export interface PolicySummary {
  "Data Collection": PolicySection;
  "User Rights": PolicySection;
  "Data Sharing": PolicySection;
  "Opt-Out Options": PolicySection;
  "Arbitration Clause": PolicySection;
}

export interface SummarizePolicyResponse {
  summary_id: string;
  source_name: string;
  source_type: "pdf" | "url";
  summary: PolicySummary;
  created_at: string;
}

export interface GetSummaryResponse {
  summary_id: string;
  source_name: string;
  source_type: "pdf" | "url";
  source_url?: string;
  summary: PolicySummary;
  created_at: string;
}

export interface ErrorResponse {
  error: string;
  detail?: string;
}

/**
 * Convert backend risk levels to frontend risk levels
 */
export const mapRiskLevel = (risk: RiskLevel): "safe" | "caution" | "danger" => {
  switch (risk) {
    case "green":
      return "safe";
    case "yellow":
      return "caution";
    case "red":
      return "danger";
    default:
      return "caution";
  }
};

/**
 * Convert backend policy summary to frontend format
 */
export const mapPolicySummary = (summary: PolicySummary) => {
  return [
    {
      title: "Data Collection",
      summary: summary["Data Collection"].summary,
      riskLevel: mapRiskLevel(summary["Data Collection"].risk),
      details: summary["Data Collection"].details,
    },
    {
      title: "User Rights",
      summary: summary["User Rights"].summary,
      riskLevel: mapRiskLevel(summary["User Rights"].risk),
      details: summary["User Rights"].details,
    },
    {
      title: "Data Sharing",
      summary: summary["Data Sharing"].summary,
      riskLevel: mapRiskLevel(summary["Data Sharing"].risk),
      details: summary["Data Sharing"].details,
    },
    {
      title: "Opt-Out Options",
      summary: summary["Opt-Out Options"].summary,
      riskLevel: mapRiskLevel(summary["Opt-Out Options"].risk),
      details: summary["Opt-Out Options"].details,
    },
    {
      title: "Arbitration Clause",
      summary: summary["Arbitration Clause"].summary,
      riskLevel: mapRiskLevel(summary["Arbitration Clause"].risk),
      details: summary["Arbitration Clause"].details,
    },
  ];
};

/**
 * Summarize a policy from PDF file
 */
export const summarizePolicyFromFile = async (file: File): Promise<SummarizePolicyResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BASE_URL}/api/summarize_policy`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Summarize a policy from URL
 */
export const summarizePolicyFromUrl = async (url: string): Promise<SummarizePolicyResponse> => {
  const formData = new FormData();
  formData.append("url", url);

  const response = await fetch(`${BASE_URL}/api/summarize_policy`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Get a stored policy summary by ID
 */
export const getPolicySummary = async (summaryId: string): Promise<GetSummaryResponse> => {
  const response = await fetch(`${BASE_URL}/api/summaries/${summaryId}`);

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Health check
 */
export const healthCheck = async (): Promise<{ status: string; timestamp: string; version: string }> => {
  const response = await fetch(`${BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};
