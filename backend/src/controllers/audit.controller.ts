import { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/audit.service';
import { sendResponse } from '../utils/response';

export class AuditController {
  
  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const actorId = req.query.actorId as string;
      const action = req.query.action as string;
      const entityType = req.query.entityType as string;

      const result = await auditService.getAuditLogs({ page, limit, actorId, action, entityType });
      sendResponse(res, 200, 'Audit logs retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async getActivityFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await auditService.getActivityFeed(page, limit);
      sendResponse(res, 200, 'Activity feed retrieved', result);
    } catch (error) {
      next(error);
    }
  }
}

export const auditController = new AuditController();
