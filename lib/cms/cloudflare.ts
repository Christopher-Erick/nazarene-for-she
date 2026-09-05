import { getCloudflareContext } from "@opennextjs/cloudflare";

const ENV_WAIT_MS = 250;
const HIT_TTL_MS = 60_000;
const MISS_TTL_MS = 60_000;

type Hold = { env: CloudflareEnv | null; until: number };

let hold: Hold | null = null;
let inflight: Promise<CloudflareEnv | null> | null = null;

function wait(ms: number) {
  return new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), ms);
  });
}

/** Bound Worker env, or null quickly when the remote preview session is down. */
export async function cloudflareEnv() {
  if (hold && hold.until > Date.now()) return hold.env;
  if (inflight) return inflight;

  inflight = Promise.race([
    getCloudflareContext({ async: true })
      .then((ctx) => ctx.env)
      .catch(() => null),
    wait(ENV_WAIT_MS),
  ]).then((env) => {
    hold = { env, until: Date.now() + (env ? HIT_TTL_MS : MISS_TTL_MS) };
    inflight = null;
    return env;
  });

  return inflight;
}
