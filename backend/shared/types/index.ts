export * from '../constants/roles';
export * from '../constants/permissions';
export * from '../constants/document-status';
export * from '../schemas/document.schema';

export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  error: any | null;
  timestamp: string;
  requestId: string;
}
