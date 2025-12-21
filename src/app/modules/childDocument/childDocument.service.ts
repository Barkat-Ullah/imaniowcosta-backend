import { Prisma } from '@prisma/client';
import { IPaginationOptions } from '../../interface/pagination.type';
import { prisma } from '../../utils/prisma';
import ApiError from '../../errors/AppError';
import httpStatus from 'http-status';
import { paginationHelper } from '../../utils/calculatePagination';
import { Request } from 'express';
import { fileUploader } from '../../utils/fileUploader';

// create ChildDocument
const createChildDocument = async (req: Request) => {
  const parsedData = req.body.data ? JSON.parse(req.body.data) : {};
  const childId = parsedData.childId;

  const files = req.files as
    | {
        [fieldname: string]: Express.Multer.File[];
      }
    | undefined;

  let uploadedFiles: {
    image?: string;
    video?: string;
    pdf?: string;
    files?: string;
  } = {};

  try {
    // Image
    if (files?.image?.[0]) {
      const upload = await fileUploader.uploadToCloudinary(files.image[0]);
      uploadedFiles.image = upload.Location; 
    }

    // Video
    if (files?.video?.[0]) {
      const upload = await fileUploader.uploadToCloudinary(files.video[0]);
      uploadedFiles.video = upload.Location;
    }

    // PDF
    if (files?.pdf?.[0]) {
      const upload = await fileUploader.uploadToCloudinary(files.pdf[0]);
      uploadedFiles.pdf = upload.Location;
    }

    // Single "files" field (you have maxCount: 1)
    if (files?.files?.[0]) {
      const upload = await fileUploader.uploadToCloudinary(files.files[0]);
      uploadedFiles.files = upload.Location;
      // If you want to support multiple files later, change maxCount and do:
      // uploadedFiles.files = JSON.stringify(uploads.map(u => u.Location));
    }
  } catch (error: any) {
    console.error('Cloudinary upload error:', error); // ← Log real error!
    throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to upload file', error);
  }

  // Create document
  const data = {
    childId,
    ...uploadedFiles,
  };

  const result = await prisma.childDocument.create({
    data,
    include: { child: { select: { id: true, fullName: true } } },
  });

  return result;
};
// get all ChildDocument
// type IChildDocumentFilterRequest = {
//   searchTerm?: string;
//   id?: string;
//   createdAt?: string;
// };
// const childDocumentSearchAbleFields = ['fullName', 'email', 'userName'];

const getChildDocumentListIntoDb = async (childId: string) => {
  // Verify that the child exists
  const childExists = await prisma.children.findUnique({
    where: { id: childId },
  });

  if (!childExists) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Child not found');
  }

  // Fetch all documents for this child
  const documents = await prisma.childDocument.findMany({
    where: { childId },
    include: {
      child: {
        select: {
          id: true,
          fullName: true,
          dateOfBirth: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return documents;
};
// get ChildDocument by id
const getChildDocumentById = async (id: string) => {
  const result = await prisma.childDocument.findUnique({
    where: { id },
    include: {
      child: {
        select: {
          id: true,
          fullName: true,
          dateOfBirth: true,
        },
      },
    },
  });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'ChildDocument not found');
  }
  return result;
};

// update ChildDocument
const updateChildDocumentIntoDb = async (id: string, data: any) => {
  const result = await prisma.childDocument.update({
    where: { id },
    data,
  });
  return result;
};

// delete ChildDocument
const deleteChildDocumentIntoDb = async (id: string) => {
  const documentExists = await prisma.childDocument.findUnique({
    where: { id },
  });

  if (!documentExists) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Child document not found');
  }
  const result = await prisma.childDocument.delete({
    where: { id },
  });
  return result;
};

export const childDocumentService = {
  createChildDocument,
  getChildDocumentListIntoDb,
  getChildDocumentById,
  updateChildDocumentIntoDb,
  deleteChildDocumentIntoDb,
};
