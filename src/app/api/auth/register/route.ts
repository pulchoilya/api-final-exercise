import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { registerSchema } from '@/lib/validations/auth';

export async function POST(req: Request) {
  const body = await req.json();
  const validated = registerSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json(
      { error: validated.error.issues[0]?.message ?? 'Invalid data' },
      { status: 400 },
    );
  }

  const { name, email, password } = validated.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: 'Email already registered' },
      { status: 409 },
    );
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: { name, email, hashedPassword },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}
