import { getMediaType, uploadFile } from '@/lib/storage';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const chatId = formData.get('chatId') as string;
    const senderId = formData.get('senderId') as string;

    if (!file || !chatId || !senderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Upload file to Firebase Storage
    const mediaUrl = await uploadFile(file, senderId, chatId);
    const mediaType = getMediaType(file);

    return NextResponse.json({
      success: true,
      mediaUrl,
      mediaType,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}


