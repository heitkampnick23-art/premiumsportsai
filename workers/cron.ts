// Cron Worker: refresh KV-cached games every 60s. Hits the public API
// endpoint on the Pages deployment, which has access to Anthropic/Odds keys.

export interface Env {
  APP_URL: string;
  CRON_SECRET: string;
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const url = `${env.APP_URL}/api/cron/refresh?key=${env.CRON_SECRET}`;
    ctx.waitUntil(fetch(url, { method: 'POST' }).catch(() => null));
  },
};
