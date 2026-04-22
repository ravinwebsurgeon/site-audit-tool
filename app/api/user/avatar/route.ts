import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { updateUserProfile } from '@/db/user';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid multipart request' }, { status: 400 });
  }

  const file = formData.get('avatar');
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { success: false, message: 'Invalid file type. Allowed: JPG, PNG, GIF, WebP' },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ success: false, message: 'File too large. Max 2 MB' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${buffer.toString('base64')}`;

  await updateUserProfile(session.user.id, { image: dataUri });

  return NextResponse.json({ success: true, data: { url: dataUri } });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  await updateUserProfile(session.user.id, { image: undefined });

  return NextResponse.json({ success: true });
}
