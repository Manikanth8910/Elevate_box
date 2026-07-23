import { z } from 'zod';

export const CreateDocumentSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(200, 'Title cannot exceed 200 characters'),
  content: z.string().trim().min(20, 'Content must be at least 20 characters').max(50000, 'Content too long'),
  tags: z.any().optional(),
  attachments: z.any().optional()
});

export const UpdateDocumentSchema = CreateDocumentSchema.partial();
