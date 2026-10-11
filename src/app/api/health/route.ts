import { NextResponse } from 'next/server';
import { sqlClient } from '@/db';

export async function GET() {
  try {
    if (!sqlClient) {
      return NextResponse.json({
        status: 'ok',
        database: 'not_configured',
        timestamp: new Date().toISOString(),
      });
    }

    await sqlClient`SELECT 1`;
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown database error',
      },
      { status: 500 }
    );
  }
}
