type CacheEntry<T> = {
  expiresAt: number;
  value: ConnectorResponse<T>;
};

export type ConnectorResponse<T> = {
  ok: boolean;
  status: number;
  data?: T;
  cached: boolean;
  error?: string;
};

type CachedJsonOptions = {
  source: string;
  cacheKey: string;
  url: string;
  ttlMs: number;
  minIntervalMs?: number;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  retryStatusCodes?: number[];
  init?: RequestInit;
};

const cache = new Map<string, CacheEntry<unknown>>();
const sourceLastCall = new Map<string, number>();
const sourceQueues = new Map<string, Promise<void>>();

export async function cachedJson<T>({
  source,
  cacheKey,
  url,
  ttlMs,
  minIntervalMs = 250,
  timeoutMs = 7_000,
  retries = 0,
  retryDelayMs = 500,
  retryStatusCodes = [408, 425, 429, 500, 502, 503, 504],
  init
}: CachedJsonOptions): Promise<ConnectorResponse<T>> {
  const key = `${source}:${cacheKey}`;
  const now = Date.now();
  const cached = cache.get(key) as CacheEntry<T> | undefined;
  if (cached && cached.expiresAt > now) {
    return { ...cached.value, cached: true };
  }

  let lastResult: ConnectorResponse<T> | undefined;
  const attempts = Math.max(1, retries + 1);

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await waitForSourceTurn(source, minIntervalMs);
    const result = await requestJson<T>(url, timeoutMs, init);
    lastResult = result;

    const shouldRetry =
      attempt < attempts - 1 && (!result.ok || retryStatusCodes.includes(result.status));

    if (!shouldRetry) break;
    await sleep(retryDelayMs * (attempt + 1));
  }

  const result =
    lastResult ?? {
      ok: false,
      status: 0,
      cached: false,
      error: "Connector request failed"
    };
  const cacheMs = result.ok ? ttlMs : Math.min(ttlMs, 60_000);
  cache.set(key, { expiresAt: Date.now() + cacheMs, value: result });
  return result;
}

async function waitForSourceTurn(source: string, minIntervalMs: number) {
  const previous = sourceQueues.get(source) ?? Promise.resolve();
  let release: () => void = () => undefined;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  sourceQueues.set(source, previous.then(() => current));

  await previous;
  const last = sourceLastCall.get(source) ?? 0;
  const waitMs = Math.max(0, last + minIntervalMs - Date.now());
  if (waitMs > 0) await sleep(waitMs);
  sourceLastCall.set(source, Date.now());
  release();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJson<T>(url: string, timeoutMs: number, init?: RequestInit): Promise<ConnectorResponse<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store"
    });
    const text = await response.text();
    const data = text ? tryParseJson<T>(text) : undefined;
    return {
      ok: response.ok,
      status: response.status,
      data,
      cached: false
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return {
      ok: false,
      status: 0,
      cached: false,
      error: aborted ? "Connector request timed out" : error instanceof Error ? error.message : "Connector request failed"
    };
  } finally {
    clearTimeout(timeout);
  }
}

function tryParseJson<T>(text: string) {
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined;
  }
}
