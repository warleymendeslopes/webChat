import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadFile(
  file: File,
  userId: string,
  chatId: string
): Promise<string> {
  const timestamp = Date.now();
  const fileName = `${userId}/${chatId}/${timestamp}_${file.name}`;
  const storageRef = ref(storage, fileName);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

export function getMediaType(file: File): 'image' | 'video' | 'audio' | 'document' {
  const type = file.type;
  
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  return 'document';
}


