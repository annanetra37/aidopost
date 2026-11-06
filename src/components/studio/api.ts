"use client";
// Tiny typed fetch helpers for the studio.
export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
    public data: Record<string, unknown> = {},
  ) {
    super(code);
  }
}

export async function api<T = unknown>(
  url: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, ...rest } = init;
  const res = await fetch(url, {
    ...rest,
    headers:
      json !== undefined
        ? { "Content-Type": "application/json", ...(rest.headers ?? {}) }
        : rest.headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? "generic", res.status, data);
  return data as T;
}

export type Brand = {
  id: string;
  name: string;
  description: string;
  sourceType: string;
  industryId: string | null;
  industryNames: Record<string, string> | null;
};
export type Generation = {
  id: string;
  variant: "A" | "B" | "C";
  status: "queued" | "running" | "succeeded" | "failed";
  stage: string;
  errorCode: string | null;
  previewUrl: string | null;
};
export type SessionView = {
  id: string;
  style: "minimalist" | "casual" | "premium" | null;
  aspectRatio: "1:1" | "4:5" | "9:16";
  status: "draft" | "analysing" | "ready" | "failed";
  brand: {
    id: string;
    name: string;
    industryId: string | null;
    industryNames: Record<string, string> | null;
  };
  photos: { id: string; url: string; width: number; height: number }[];
  analysis: {
    productType: string;
    productName: string;
    sameProduct: boolean;
    photoIssues: string[];
  } | null;
  locked: boolean;
  generations: Generation[];
};
export type Me = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  plan: "free" | "lite" | "pro";
  credits: number;
  subscription: { status: string } | null;
};
