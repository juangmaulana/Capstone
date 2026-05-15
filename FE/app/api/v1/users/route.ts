import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { parseWithZod } from '@/lib/validation/parse-with-zod';
import { user } from '@/server/features/user';
import { sendWelcomeEmail } from '@/server/lib/email';
import { createUserSchema } from '@/server/features/user/schemas/create-user.schema';
import { listUsersSchema } from '@/server/features/user/schemas/list-users.schema';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandling(async (req: NextRequest) => {
  const searchParams = {
    search: req.nextUrl.searchParams.get("search") ?? undefined,
    roleId: req.nextUrl.searchParams.get("roleId") ?? undefined,
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
    offset: req.nextUrl.searchParams.get("offset") ?? undefined,
  }
  const input = parseWithZod(listUsersSchema, searchParams)
  const data = await user.queries.all(input);

  return NextResponse.json({ success: true, data, meta: {} })
})

export const POST = withErrorHandling(async (req: NextRequest) => {
  const rawBody = await req.json();
  const input = parseWithZod(createUserSchema, rawBody)
  const data = await user.commands.create(input)

  // Send welcome email with temporary password (non-blocking — don't fail user creation if email fails)
  sendWelcomeEmail(input.email, input.name, input.password)
    .then((sent) => {
      if (sent) {
        console.log(`Welcome email sent to ${input.email}`);
      } else {
        console.warn(`Welcome email could not be sent to ${input.email} — check SMTP configuration`);
      }
    })
    .catch((err) => {
      console.error(`Welcome email error for ${input.email}:`, err);
    });

  return NextResponse.json({ success: true, data }, { status: 201 })
})