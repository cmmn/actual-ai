import { NextRequest, NextResponse } from 'next/server'
import { processRequest } from './processRequest'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('API v1 POST body:', body)
    return processRequest({ body })
  } catch (e: unknown) {
    console.error(e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
  

  
  
}