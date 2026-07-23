import { Request, Response, NextFunction } from 'express';
import { documentService } from '../services/document.service';
import { CreateDocumentSchema, UpdateDocumentSchema } from '../validators/document.validator';
import { sendResponse } from '../utils/response';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DocumentController {
  
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = CreateDocumentSchema.parse(req.body);
      const doc = await documentService.createDraft(res.locals.user, data.title, data.content);
      sendResponse(res, 201, 'Document created successfully', doc);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = UpdateDocumentSchema.parse(req.body);
      const version = req.body.version ? Number(req.body.version) : undefined;
      const doc = await documentService.editDraft(res.locals.user, id, data.title, data.content, version);
      sendResponse(res, 200, 'Document updated successfully', doc);
    } catch (error) {
      next(error);
    }
  }

  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const doc = await documentService.submitDraft(res.locals.user, id);
      sendResponse(res, 200, 'Document submitted successfully', doc);
    } catch (error) {
      next(error);
    }
  }

  async resubmit(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const doc = await documentService.resubmitDocument(res.locals.user, id);
      sendResponse(res, 200, 'Document resubmitted successfully', doc);
    } catch (error) {
      next(error);
    }
  }

  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reviewerId, priority, deadline } = req.body;
      const doc = await documentService.assignReviewer(res.locals.user, id, reviewerId, priority, new Date(deadline));
      sendResponse(res, 200, 'Reviewer assigned successfully', doc);
    } catch (error) {
      next(error);
    }
  }

  async postMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { text } = req.body;
      if (!text || text.trim() === '') return res.status(400).json({ success: false, message: 'Text is required' });
      const message = await documentService.postMessage(res.locals.user, id, text);
      sendResponse(res, 201, 'Message posted successfully', message);
    } catch (error) {
      next(error);
    }
  }

  async getThread(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const thread = await documentService.getThread(id);
      sendResponse(res, 200, 'Thread retrieved successfully', thread || { messages: [] });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const user = res.locals.user;
      let rbacWhere: any = {};

      if (user.role === 'VIEWER') {
        rbacWhere = { status: 'PUBLISHED' };
      } else if (user.role === 'AUTHOR') {
        rbacWhere = { OR: [{ authorId: user.id }, { status: 'PUBLISHED' }] };
      } else if (user.role === 'REVIEWER') {
        rbacWhere = { status: { not: 'DRAFT' } };
      }
      // ADMIN sees all

      const whereClause = {
        softDeleteFlag: false,
        ...rbacWhere
      };

      const documents = await prisma.document.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: { author: { select: { firstName: true, lastName: true, email: true } } }
      });
      const total = await prisma.document.count({ where: whereClause });

      sendResponse(res, 200, 'Documents retrieved', { documents, total, page, limit });
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = res.locals.user;

      const doc = await prisma.document.findUnique({
        where: { id, softDeleteFlag: false },
        include: { 
          author: { select: { firstName: true, lastName: true, email: true } },
          workflowHistory: { orderBy: { createdAt: 'desc' } }
        }
      });
      if (!doc) return res.status(404).json({ success: false, message: 'Not found' });

      let isAllowed = false;
      if (user.role === 'ADMIN') {
        isAllowed = true;
        doc.body = ''; // Hide document body from Admin
      } else if (user.role === 'VIEWER') {
        isAllowed = doc.status === 'PUBLISHED';
      } else if (user.role === 'AUTHOR') {
        isAllowed = doc.authorId === user.id || doc.status === 'PUBLISHED';
      } else if (user.role === 'REVIEWER') {
        isAllowed = doc.status !== 'DRAFT';
      }

      if (!isAllowed) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      sendResponse(res, 200, 'Document retrieved', doc);
    } catch (error) {
      next(error);
    }
  }
}

export const documentController = new DocumentController();
