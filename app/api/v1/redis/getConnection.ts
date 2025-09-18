import { Redis } from '@upstash/redis'
import { Envs } from 'types'
 

const dbKvs: Record<Envs, {
  url?: string;
  token?: string;
}> = {
  production: {
    url: process.env.UPSTASH_REDIS_PRODUCTION_URL,
    token: process.env.UPSTASH_REDIS_PRODUCTION_TOKEN
  },
  preview: {
    url: process.env.UPSTASH_REDIS_PREVIEW_URL,
    token: process.env.UPSTASH_REDIS_PREVIEW_TOKEN
  },
  requests: {
    url: process.env.UPSTASH_REDIS_REQUESTS_URL,
    token: process.env.UPSTASH_REDIS_REQUESTS_TOKEN
  },
  errors: {
    url: process.env.UPSTASH_REDIS_ERRORS_URL,
    token: process.env.UPSTASH_REDIS_ERRORS_TOKEN
  },
  logs : {
    url: process.env.UPSTASH_REDIS_LOGS_URL,
    token: process.env.UPSTASH_REDIS_LOGS_TOKEN
  },
  rateLimit: {
    url: process.env.UPSTASH_REDIS_RATE_LIMIT_URL,
    token: process.env.UPSTASH_REDIS_RATE_LIMIT_TOKEN
  },
}

export async function getConnection({
  env
}: {
  env: Envs;
}) {
  // console.log('getConnection', env)
  const upstashConfig = dbKvs[env] as { url: string; token: string }
  // console.log('upstashConfig in getConnection', upstashConfig)
  const conn = new Redis(upstashConfig)
  return conn
}
