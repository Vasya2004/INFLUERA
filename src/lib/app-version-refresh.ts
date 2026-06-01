const CHECK_INTERVAL_MS = 60_000;
const BUILD_SCRIPT_PATTERN = /\/assets\/[^"']+\.js/g;
const RELOAD_TARGET_KEY = "influera_reload_target_build_v1";

let initialSignature: string | null = null;
let lastCheckAt = 0;
let checking = false;

function readCurrentSignature() {
  const assets = [
    ...Array.from(document.querySelectorAll<HTMLScriptElement>("script[src]")).map(node => node.src),
  ];

  return assets
    .map(url => {
      try {
        const parsed = new URL(url, window.location.href);
        return `${parsed.pathname}${parsed.search}`;
      } catch {
        return url;
      }
    })
    .filter(Boolean)
    .sort()
    .join("|");
}

function readHtmlSignature(html: string) {
  const matches = html.match(BUILD_SCRIPT_PATTERN) ?? [];
  return [...new Set(matches)].sort().join("|");
}

function reloadOnceForBuild(remoteSignature: string) {
  try {
    const previousTarget = sessionStorage.getItem(RELOAD_TARGET_KEY);
    if (previousTarget === remoteSignature) return;
    sessionStorage.setItem(RELOAD_TARGET_KEY, remoteSignature);
  } catch {
    // If sessionStorage is unavailable, prefer not reloading over a reload loop.
    return;
  }

  window.location.reload();
}

async function checkForNewBuild(force = false) {
  if (checking) return;
  if (document.visibilityState !== "visible") return;

  const now = Date.now();
  if (!force && now - lastCheckAt < CHECK_INTERVAL_MS) return;

  checking = true;
  lastCheckAt = now;

  try {
    const response = await fetch(`/?__influera_version=${now}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!response.ok) return;

    const html = await response.text();
    const remoteSignature = readHtmlSignature(html);
    if (remoteSignature && initialSignature && remoteSignature !== initialSignature) {
      reloadOnceForBuild(remoteSignature);
      return;
    }

    if (remoteSignature && remoteSignature === initialSignature) {
      try {
        sessionStorage.removeItem(RELOAD_TARGET_KEY);
      } catch {
        // Ignore storage cleanup failures.
      }
    }
  } catch {
    // Offline or captive network: retry on next focus/online event.
  } finally {
    checking = false;
  }
}

export function registerAppVersionRefresh() {
  if (typeof window === "undefined") return;
  if (initialSignature) return;

  const register = () => {
    initialSignature = readCurrentSignature();
    if (!initialSignature) return;

    const check = () => void checkForNewBuild();
    const forceCheck = () => void checkForNewBuild(true);

    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    window.addEventListener("pageshow", check);
    window.addEventListener("online", forceCheck);
  };

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", register, { once: true });
  } else {
    register();
  }
}
