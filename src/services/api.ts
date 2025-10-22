/**
 * API service for communicating with the PolicyPal backend
 */

const BASE_URL = "http://localhost:8000";

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

type FetchOptions = RequestInit & { skipAuth?: boolean };

const fetchWithAuth = (url: string, options: FetchOptions = {}) => {
  const { skipAuth, headers, ...rest } = options;
  const mergedHeaders = new Headers(headers ?? {});
  if (!skipAuth && authToken && !mergedHeaders.has("Authorization")) {
    mergedHeaders.set("Authorization", `Bearer ${authToken}`);
  }

  return fetch(url, {
    ...rest,
    headers: mergedHeaders,
  });
};

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

  const response = await fetchWithAuth(`${BASE_URL}/api/summarize_policy`, {
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

  const response = await fetchWithAuth(`${BASE_URL}/api/summarize_policy`, {
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
  const response = await fetchWithAuth(`${BASE_URL}/api/summary/${summaryId}`);

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
  const response = await fetchWithAuth(`${BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const response = await fetchWithAuth(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    skipAuth: true,
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json().catch(() => ({ error: "Login failed" }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const register = async (payload: RegisterPayload): Promise<RegisterResponse> => {
  const response = await fetchWithAuth(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    skipAuth: true,
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json().catch(() => ({ error: "Registration failed" }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const getHistory = async (): Promise<GetSummaryResponse[]> => {
  const response = await fetchWithAuth(`${BASE_URL}/api/summaries`);

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json().catch(() => ({ error: "Failed to load history" }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};
