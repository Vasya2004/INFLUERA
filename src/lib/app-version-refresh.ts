const CHECK_INTERVAL_MS = 60_000;
const BUILD_ASSET_PATTERN = /\/assets\/[^"']+\.(?:js|css)/g;

let initialSignature: string | null = null;
let lastCheckAt = 0;
let checking = false;

function readCurrentSignature() {
  const assets = [
    ...Array.from(document.querySelectorAll<HTMLScriptElement>("script[src]")).map(node => node.src),
    ...Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]')).map(node => node.href),
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
  const matches = html.match(BUILD_ASSET_PATTERN) ?? [];
  return [...new Set(matches)].sort().join("|");
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
      window.location.reload();
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

  initialSignature = readCurrentSignature();

  const check = () => void checkForNewBuild();
  const forceCheck = () => void checkForNewBuild(true);

  document.addEventListener("visibilitychange", check);
  window.addEventListener("focus", check);
  window.addEventListener("pageshow", check);
  window.addEventListener("online", forceCheck);
}
