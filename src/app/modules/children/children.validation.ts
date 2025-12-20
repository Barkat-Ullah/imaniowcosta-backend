import { z } from 'zod';
import {
  PersonalizationType,
  LearningStage,
  SupportReceived,
  CommunicationLevel,
  ToiletingStatus,
} from '@prisma/client';

const createSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  dateOfBirth: z.string(),
  personalizationType: z.nativeEnum(PersonalizationType).optional(),
  learningStage: z.nativeEnum(LearningStage).optional(),
  ageGroup: z.string().optional(),
  supportReceived: z.array(z.nativeEnum(SupportReceived)).optional(),
  communication: z.nativeEnum(CommunicationLevel).optional(),
  toileting: z.nativeEnum(ToiletingStatus).optional(),
  diagnoses: z.array(z.string()).optional(),
});

const updateSchema = createSchema.partial();

export const childrenValidation = {
  createSchema,
  updateSchema,
};
