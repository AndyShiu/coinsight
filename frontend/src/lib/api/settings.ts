import { apiFetch } from "./client";
import type {
  ApiKeysResponse,
  ApiKeysUpdateRequest,
  WatchlistResponse,
  DashboardPinsResponse,
} from "@/lib/types/settings";

export function getApiKeys(): Promise<ApiKeysResponse> {
  return apiFetch("/api/v1/settings/api-keys");
}

export function updateApiKeys(data: ApiKeysUpdateRequest): Promise<ApiKeysResponse> {
  return apiFetch("/api/v1/settings/api-keys", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteApiKey(name: string): Promise<{ status: string }> {
  return apiFetch(`/api/v1/settings/api-keys/${name}`, {
    method: "DELETE",
  });
}

// ---- Watchlist ----

export function getWatchlist(): Promise<WatchlistResponse> {
  return apiFetch("/api/v1/settings/watchlist");
}

export function updateWatchlist(symbols: string[]): Promise<WatchlistResponse> {
  return apiFetch("/api/v1/settings/watchlist", {
    method: "PUT",
    body: JSON.stringify({ symbols }),
  });
}

// ---- Dashboard Pins ----

export function getDashboardPins(): Promise<DashboardPinsResponse> {
  return apiFetch("/api/v1/settings/dashboard-pins");
}

export function updateDashboardPins(symbols: string[]): Promise<DashboardPinsResponse> {
  return apiFetch("/api/v1/settings/dashboard-pins", {
    method: "PUT",
    body: JSON.stringify({ symbols }),
  });
}
