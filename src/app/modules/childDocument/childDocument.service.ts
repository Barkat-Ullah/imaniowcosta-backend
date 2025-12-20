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
  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  let uploadedFiles: {
    image?: string;
    video?: string;
    pdf?: string;
    files?: string;
  } = {};

  try {
    // Upload image to Cloudinary
    if (files?.image && files.image[0]) {
      const imageUpload = await fileUploader.uploadToCloudinary(files.image[0]);
      uploadedFiles.image = imageUpload.Location;
    }

    // Upload video to Cloudinary
    if (files?.video && files.video[0]) {
      const videoUpload = await fileUploader.uploadToCloudinary(files.video[0]);
      uploadedFiles.video = videoUpload.Location;
    }

    // Upload PDF to Cloudinary
    if (files?.pdf && files.pdf[0]) {
      const pdfUpload = await fileUploader.uploadToCloudinary(files.pdf[0]);
      uploadedFiles.pdf = pdfUpload.Location;
    }

    // Upload multiple files to Cloudinary
    if (files?.files[0]) {
      const filesUpload = await fileUploader.uploadToCloudinary(files.files[0]);
      uploadedFiles.files = filesUpload.Location;
      // Store as JSON string array
      // uploadedFiles.files = JSON.stringify(
      //   fileUploads.map((upload: { Location: any }) => upload.Location),
      // );
    }
  } catch {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to upload file');
  }
  // Combine uploaded file URLs with request body data
  const data = {
    childId,
    ...uploadedFiles,
  };
  const result = await prisma.childDocument.create({
    data,
    include: {
      child: {
        select: { id: true, fullName: true },
      },
    },
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
