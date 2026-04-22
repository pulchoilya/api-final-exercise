import { NextResponse } from 'next/server';
import { AuthError } from './auth';

export function errorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }
  console.error(error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
