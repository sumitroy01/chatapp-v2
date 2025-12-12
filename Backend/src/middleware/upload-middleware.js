import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    let folderName = 'misc';
    if (file.fieldname === 'avatar') folderName = 'profiles';
    if (file.fieldname === 'proofs') folderName = 'proofs';
    if (file.fieldname === 'media') folderName = 'chat-media';

    const type = file.mimetype || '';

    const isImageOrPdf =
      type.startsWith('image/') || type === 'application/pdf';

    const resource_type = isImageOrPdf ? 'image' : 'video';

    return {
      folder: folderName,
      resource_type,
      allowed_formats: [
        'jpg',
        'png',
        'jpeg',
        'webp',
        'pdf',
        'webm',
        'mp3',
        'wav',
        'ogg',
        'mp4',
        'mov',
        'm4a',
      ],
    };
  },
});

export default multer({ storage });
