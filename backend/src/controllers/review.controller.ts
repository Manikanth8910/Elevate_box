import { Request, Response, NextFunction } from 'express';
import { reviewService } from '../services/review.service';
import { sendResponse } from '../utils/response';
import { PrismaClient, DocumentStatus } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const ApproveRejectSchema = z.object({
  version: z.number().int().positive(),
  comment: z.string().optional(),
});

export class ReviewController {
  
  async getReviewQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const documents = await prisma.document.findMany({
        where: { 
          status: DocumentStatus.SUBMITTED,
          authorId: { not: res.locals.user.id }, // Cannot review own documents
          softDeleteFlag: false 
        },
        skip,
        take: limit,
        orderBy: { submittedAt: 'asc' },
        include: { author: { select: { firstName: true, lastName: true, email: true } } }
      });

      const total = await prisma.document.count({
        where: { status: DocumentStatus.SUBMITTED, authorId: { not: res.locals.user.id }, softDeleteFlag: false }
      });

      sendResponse(res, 200, 'Review queue retrieved', { documents, total, page, limit });
    } catch (error) {
      next(error);
    }
  }

  async startReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const doc = await reviewService.startReview(res.locals.user, id);
      sendResponse(res, 200, 'Review started successfully', doc);
    } catch (error) {
      next(error);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { version } = ApproveRejectSchema.parse(req.body);
      const doc = await reviewService.approveDocument(res.locals.user, id, version);
      sendResponse(res, 200, 'Document approved successfully', doc);
    } catch (error) {
      next(error);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { version, comment } = ApproveRejectSchema.parse(req.body);
      
      if (!comment || comment.trim() === '') {
        return res.status(400).json({ success: false, message: 'Comment is required for rejection' });
      }

      const doc = await reviewService.rejectDocument(res.locals.user, id, version, comment);
      sendResponse(res, 200, 'Document rejected successfully', doc);
    } catch (error) {
      next(error);
    }
  }

  async requestChanges(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { version, comment } = ApproveRejectSchema.parse(req.body);
      
      if (!comment || comment.trim() === '') {
        return res.status(400).json({ success: false, message: 'Comment is required for requesting changes' });
      }

      const doc = await reviewService.requestChanges(res.locals.user, id, version, comment);
      sendResponse(res, 200, 'Changes requested successfully', doc);
    } catch (error) {
      next(error);
    }
  }

  async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const doc = await reviewService.publishDocument(res.locals.user, id);
      sendResponse(res, 200, 'Document published successfully', doc);
    } catch (error) {
      next(error);
    }
  }

  async archive(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const doc = await reviewService.archiveDocument(res.locals.user, id);
      sendResponse(res, 200, 'Document archived successfully', doc);
    } catch (error) {
      next(error);
    }
  }
}

export const reviewController = new ReviewController();
