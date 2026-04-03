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

let warnedEphemeral = false;

export async function loadState(): Promise<AppState> {
  if (process.env.VERCEL && !useRedis() && !warnedEphemeral) {
    warnedEphemeral = true;
    console.warn(
      "[auth] No UPSTASH_REDIS_* env: using in-memory user store (resets when the serverless instance cold-starts). Add Upstash Redis for durable accounts without a SQL database."
    );
  }
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
