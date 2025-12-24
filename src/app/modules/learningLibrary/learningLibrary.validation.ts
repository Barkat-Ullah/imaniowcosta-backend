import { z } from 'zod';

const EnumContent = z.enum(['Articles', 'Podcast', 'Books']);

const EnumCategory = z.enum([
  'Daily_Living',
  'Communication',
  'Parent_Support',
]);

const createSchema = z.object({
  title: z
    .string({
      required_error: 'Title is required',
      invalid_type_error: 'Title must be a string',
    })
    .min(1, 'Title cannot be empty'),
  description: z
    .string({
      required_error: 'Description is required',
    })
    .min(1, 'Description cannot be empty'),
  category: z
    .enum(['Daily_Living', 'Communication', 'Parent_Support'], {
      required_error: 'Category is required',
      invalid_type_error: 'Invalid category value',
    })
    .optional(),
  content: z
    .enum(['Articles', 'Podcast', 'Books'], {
      required_error: 'Content type is required',
      invalid_type_error: 'Invalid content type',
    })
    .optional(),
  tags: z
    .array(
      z.string({
        invalid_type_error: 'Tag must be a string',
      }),
      {
        required_error: 'Tags are required',
        invalid_type_error: 'Tags must be an array',
      },
    )
    .min(1, 'At least one tag is required')
    .optional(),
  estimatedTime: z
    .string({
      required_error: 'Estimated time is required',
    })
    .min(1, 'Estimated time cannot be empty')
    .optional(),
  image: z.string().url('Image must be a valid URL').optional(),
  content_url: z.string().url('Content URL must be a valid URL').optional(),
});

const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  category: EnumCategory.optional(),
  content: EnumContent.optional(),
  tags: z.array(z.string()).optional(),
  estimatedTime: z.string().optional(),
  image: z.string().url().optional(),
  content_url: z.string().url().optional(),
});
export const learningLibraryValidation = {
  createSchema,
  updateSchema,
};
