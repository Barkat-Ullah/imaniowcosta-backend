import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import {
  S3Client,
  PutObjectCommand,
  ObjectCannedACL,
} from '@aws-sdk/client-s3';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import streamifier from 'streamifier';
import dotenv from 'dotenv';

dotenv.config();

// Configure DigitalOcean Spaces
const s3Client = new S3Client({
  region: 'us-east-1',
  endpoint: process.env.DO_SPACE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.DO_SPACE_ACCESS_KEY || '',
    secretAccessKey: process.env.DO_SPACE_SECRET_KEY || '',
  },
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer configuration using memoryStorage (for DigitalOcean & Cloudinary)
// utils/fileUploader.ts এ multer configuration update করুন

const storage = multer.memoryStorage();

// File filter for validation
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'application/pdf',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 50MB max
  },
});

// ✅ Fixed Cloudinary Storage
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    public_id: (req: any, file: { originalname: any }) =>
      `${Date.now()}_${file.originalname}`,
  },
});

const cloudinaryUpload = multer({ storage: cloudinaryStorage });

// Upload single image
const uploadSingle = upload.single('image');
const uploadFile = upload.single('file');

// Upload multiple images
const uploadMultipleImage = upload.fields([{ name: 'images', maxCount: 15 }]);

// Upload profile and banner images
const updateProfile = upload.fields([
  { name: 'profile', maxCount: 1 },
  { name: 'banner', maxCount: 1 },
]);

// Upload car images
const uploadCarImages = upload.fields([
  { name: 'carImage', maxCount: 1 },
  { name: 'photoGalary', maxCount: 20 },
]);

// ✅ Fixed Cloudinary Upload (Now supports buffer)
const uploadToCloudinary = async (
  file: Express.Multer.File,
): Promise<{ Location: string; public_id: string }> => {
  if (!file) {
    throw new Error('File is required for uploading.');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'uploads',
        resource_type: 'auto', // Supports images, videos, etc.
        use_filename: true,
        unique_filename: false,
      },
      (error, result) => {
        if (error) {
          console.error('Error uploading file to Cloudinary:', error);
          return reject(error);
        }

        // ✅ Explicitly return `Location` and `public_id`
        resolve({
          Location: result?.secure_url || '', // Cloudinary URL
          public_id: result?.public_id || '',
        });
      },
    );

    // Convert buffer to stream and upload
    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

// ✅ Unchanged: DigitalOcean Upload
const uploadToDigitalOcean = async (file: Express.Multer.File) => {
  if (!file) {
    throw new Error('File is required for uploading.');
  }

  try {
    const Key = `nathancloud/${Date.now()}_${uuidv4()}_${file.originalname}`;
    const uploadParams = {
      Bucket: process.env.DO_SPACE_BUCKET || '',
      Key,
      Body: file.buffer, // ✅ Use buffer instead of file path
      ACL: 'public-read' as ObjectCannedACL,
      ContentType: file.mimetype,
    };

    // Upload file to DigitalOcean Spaces
    await s3Client.send(new PutObjectCommand(uploadParams));

    // Format the URL
    const fileURL = `${process.env.DO_SPACE_ENDPOINT}/${process.env.DO_SPACE_BUCKET}/${Key}`;
    return {
      Location: fileURL,
      Bucket: process.env.DO_SPACE_BUCKET || '',
      Key,
    };
  } catch (error) {
    console.error('Error uploading file to DigitalOcean:', error);
    throw error;
  }
};

//* another way
const FILE_LIMITS = {
  image: { size: 20 * 1024 * 1024, formats: ['jpg', 'jpeg', 'png', 'webp'] }, // 5MB
  video: { size: 200 * 1024 * 1024, formats: ['mp4', 'mov', 'avi', 'webm'] }, // 50MB
  pdf: { size: 50 * 1024 * 1024, formats: ['pdf'] }, // 10MB
};

const validateFile = (
  file: Express.Multer.File,
  fileType: 'image' | 'video' | 'pdf',
) => {
  const limit = FILE_LIMITS[fileType];
  const ext = file.originalname.split('.').pop()?.toLowerCase();

  if (file.size > limit.size) {
    throw new Error(
      `${fileType} size exceeds ${limit.size / (1024 * 1024)}MB limit`,
    );
  }

  if (ext && !limit.formats.includes(ext)) {
    throw new Error(
      `Invalid ${fileType} format. Allowed: ${limit.formats.join(', ')}`,
    );
  }
};

const uploadToCloudinaryWithType = async (
  file: Express.Multer.File,
  fileType: 'image' | 'video' | 'pdf',
): Promise<{ Location: string; public_id: string; resource_type: string }> => {
  if (!file) {
    throw new Error('File is required for uploading.');
  }

  // Validate file before upload
  validateFile(file, fileType);

  return new Promise((resolve, reject) => {
    const uploadOptions: any = {
      folder: `child-documents/${fileType}s`, // organized folders
      use_filename: true,
      unique_filename: true,
      access_mode: 'public',
    };

    // Type-specific configurations
    if (fileType === 'image') {
      uploadOptions.resource_type = 'image';
      uploadOptions.transformation = [
        { quality: 'auto', fetch_format: 'auto' }, // Auto optimization
      ];
    } else if (fileType === 'video') {
      uploadOptions.resource_type = 'video';
      uploadOptions.eager = [
        { quality: 'auto', format: 'mp4' }, // Convert to MP4
      ];
      uploadOptions.eager_async = true;
    } else if (fileType === 'pdf') {
      uploadOptions.resource_type = 'raw'; // PDFs are 'raw' type
      uploadOptions.format = 'pdf';
      uploadOptions.type = 'upload';
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          if (error) {
            console.error(`Error uploading ${fileType} to Cloudinary:`, error);
            console.error('Error details:', JSON.stringify(error, null, 2)); // ✅ More details
            return reject(error);
          }
          return reject(error);
        }

        resolve({
          Location: result?.secure_url || '',
          public_id: result?.public_id || '',
          resource_type: result?.resource_type || fileType,
        });
      },
    );

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

// const uploadToDigitalOceanWithType = async (
//   file: Express.Multer.File,
//   fileType: 'image' | 'video' | 'pdf'
// ): Promise<{ Location: string; Bucket: string; Key: string; resource_type: string }> => {
//   if (!file) {
//     throw new Error('File is required for uploading.');
//   }

//   // Validate file before upload
//   validateFile(file, fileType);

//   try {
//     // Type-specific folder organization
//     const folderPath = `child-documents/${fileType}s`;
//     const timestamp = Date.now();
//     const uniqueId = uuidv4();
//     const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');

//     const Key = `${folderPath}/${timestamp}_${uniqueId}_${sanitizedFileName}`;

//     // Type-specific content type handling
//     let contentType = file.mimetype;
//     let contentDisposition = 'inline'; // Default: show in browser

//     if (fileType === 'pdf') {
//       contentType = 'application/pdf';
//       contentDisposition = 'inline; filename="' + encodeURIComponent(file.originalname) + '"';
//     } else if (fileType === 'video') {
//       // Ensure proper video mime type
//       if (!contentType.startsWith('video/')) {
//         contentType = 'video/mp4'; // default fallback
//       }
//     } else if (fileType === 'image') {
//       // Ensure proper image mime type
//       if (!contentType.startsWith('image/')) {
//         contentType = 'image/jpeg'; // default fallback
//       }
//     }

//     const uploadParams = {
//       Bucket: process.env.DO_SPACE_BUCKET || '',
//       Key,
//       Body: file.buffer,
//       ACL: 'public-read' as ObjectCannedACL,
//       ContentType: contentType,
//       ContentDisposition: contentDisposition, // ✅ PDF browser-এ open হবে
//       CacheControl: 'max-age=31536000', // 1 year cache
//       Metadata: {
//         originalname: file.originalname,
//         filetype: fileType,
//         uploadedAt: new Date().toISOString(),
//       },
//     };

//     // Upload file to DigitalOcean Spaces
//     await s3Client.send(new PutObjectCommand(uploadParams));

//     // Format the URL
//     const fileURL = `${process.env.DO_SPACE_ENDPOINT}/${process.env.DO_SPACE_BUCKET}/${Key}`;

//     return {
//       Location: fileURL,
//       Bucket: process.env.DO_SPACE_BUCKET || '',
//       Key,
//       resource_type: fileType,
//     };
//   } catch (error) {
//     console.error(`Error uploading ${fileType} to DigitalOcean:`, error);
//     throw error;
//   }
// };

// ✅ No Name Changes, Just Fixes

export const fileUploader = {
  upload,
  uploadSingle,
  uploadMultipleImage,
  updateProfile,
  uploadCarImages,
  uploadFile,
  cloudinaryUpload,
  uploadToDigitalOcean,
  uploadToCloudinary,
  uploadToCloudinaryWithType,
};
