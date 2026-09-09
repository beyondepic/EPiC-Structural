// Values come from /config.js, written at deploy time, so one built artifact
// can be promoted across environments. import.meta.env is the fallback for
// `npm run dev`.
//
// This replaces `process.env.REACT_APP_*`, a Create React App leftover: Vite
// does not populate process.env, and vite.config.ts defines it as `{}`, so
// every one of those reads resolved to undefined and the app always talked to
// localhost.
//
// NOTE: this repo has no deploy workflow yet, so nothing overwrites the
// public/config.js placeholder. Until it has one, every value here comes from
// import.meta.env, exactly as it would have before.

declare global {
  interface Window {
    __APP_CONFIG__?: unknown;
  }
}

// Anything that is not an object counts as absent. Where these apps are served
// behind an SPA catch-all, a missing /config.js comes back as index.html with
// content-type text/html, so the browser parses markup as JavaScript, throws
// SyntaxError, and leaves this undefined.
function runtimeValues(): Record<string, string | undefined> {
  const raw: unknown = window.__APP_CONFIG__;
  return typeof raw === "object" && raw !== null
    ? (raw as Record<string, string | undefined>)
    : {};
}

type ConfigKey = "API_BASE_URL" | "APP_ENV" | "BUILD_VERSION";

const buildTime: Partial<Record<ConfigKey, () => string | undefined>> = {
  API_BASE_URL: () => import.meta.env.VITE_API_BASE_URL,
  APP_ENV: () => import.meta.env.VITE_APP_ENV,
};

function read(key: ConfigKey, fallback = ""): string {
  const value = (runtimeValues()[key] ?? buildTime[key]?.())?.trim();
  return value === undefined || value === "" ? fallback : value;
}

export const API_BASE_URL = read("API_BASE_URL", "http://localhost:8002").replace(/\/+$/, "");
// The deployment environment, or "local" when nothing is configured.
export const APP_ENV = read("APP_ENV", "local");
export const BUILD_VERSION = read("BUILD_VERSION", "local");
