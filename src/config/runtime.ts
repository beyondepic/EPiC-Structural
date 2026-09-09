// Values come from /config.js, written at deploy time, so one built artifact
// can be promoted across environments. import.meta.env is the fallback for
// `npm run dev`.
//
// This replaces `process.env.REACT_APP_*`, a Create React App leftover: Vite
// does not populate process.env, and vite.config.ts defines it as `{}`, so
// every one of those reads resolved to undefined and the app always talked to
// localhost.

declare global {
  interface Window {
    __APP_CONFIG__?: Record<string, string | undefined>;
  }
}

type ConfigKey = "API_BASE_URL" | "APP_ENV" | "BUILD_VERSION";

const buildTime: Partial<Record<ConfigKey, () => string | undefined>> = {
  API_BASE_URL: () => import.meta.env.VITE_API_BASE_URL,
  APP_ENV: () => import.meta.env.VITE_APP_ENV,
};

function read(key: ConfigKey, fallback = ""): string {
  const value = (window.__APP_CONFIG__?.[key] ?? buildTime[key]?.())?.trim();
  return value === undefined || value === "" ? fallback : value;
}

export const API_BASE_URL = read("API_BASE_URL", "http://localhost:8002").replace(/\/+$/, "");
export const APP_ENV = read("APP_ENV", "development");
export const BUILD_VERSION = read("BUILD_VERSION", "local");
