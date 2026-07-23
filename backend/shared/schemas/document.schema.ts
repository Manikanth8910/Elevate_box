import { z } from 'zod';
import { DocumentStatus } from '../constants/document-status';

export const DocumentSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
});

export type DocumentCreateDTO = z.infer<typeof DocumentSchema>;
