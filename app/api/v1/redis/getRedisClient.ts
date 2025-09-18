import { NextRequest } from 'next/server'
import { getConnection } from './getConnection'
import { Envs } from 'types'

/*
  get redis instance
  based on meta.environment
  @params req
  @params req.body.meta
  @returns redis instance
*/

export async function getRedisFromEnv({ 
  req, 
}: { 
  req: NextRequest; 
}) {
  // get environment from environment settings: process.env.ENV
  // development on the dev branch                  localhost:3000
  // preview on the stg branch/preview on vercel    actual.help
  // production on the main branch                  actual.ai    

  // validate
  try {
    // get environment
    const env = process.env.ENV as Envs
    console.log('env in getRedis from ENV', env)
    
    // get redis based on environment
    // console.log('env', env)
    if (!env) throw new Error('Environment not found')
    const conn = await getConnection({ env })
    if (!conn) throw new Error('Redis client not found')
    return { conn }
  } catch(e: unknown) {
    console.error(e)
    throw new Error(`getRedisFromEnv error/env: ${process.env.ENV}/ req: ${JSON.stringify(req)}`)
  }
} 
