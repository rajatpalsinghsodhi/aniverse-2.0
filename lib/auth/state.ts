import { Redis } from "@upstash/redis";

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  password: string;
};

export type AppState = {
  users: AuthUser[];
  libraries: Record<string, unknown[]>;
};

const STATE_KEY = "animeverse:state";

let memory: AppState | null = null;

function empty(): AppState {
  return { users: [], libraries: {} };
}

function useRedis(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

/** On Vercel, auth data must be stored outside the function (Redis). */
export function assertAuthStorageConfigured(): void {
  if (process.env.VERCEL && !useRedis()) {
    const err = new Error(
      "Auth storage not configured. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel → Settings → Environment Variables (create a free database at upstash.com)."
    );
    (err as Error & { statusCode?: number }).statusCode = 503;
    throw err;
  }
}

export async function loadState(): Promise<AppState> {
  if (useRedis()) {
    const redis = Redis.fromEnv();
    const raw = await redis.get<string>(STATE_KEY);
    if (raw == null) return empty();
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw) as AppState;
      } catch {
        return empty();
      }
    }
    return raw as AppState;
  }
  if (!memory) memory = empty();
  return memory;
}

export async function saveState(state: AppState): Promise<void> {
  if (useRedis()) {
    const redis = Redis.fromEnv();
    await redis.set(STATE_KEY, JSON.stringify(state));
    return;
  }
  memory = state;
}
