import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/response';
import { activityService } from '../services/activity.service';

export class ActivityController {
  async getRecentActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const recent = await activityService.getRecentActivity(res.locals.user.id, limit);
      sendResponse(res, 200, 'Recent activity retrieved', { activity: recent });
    } catch (error) {
      next(error);
    }
  }

  async getActivityHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const history = await activityService.getActivityHistory({
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sort: req.query.sort as any,
        action: req.query.action as string,
        documentId: req.query.document as string,
        actorId: req.query.actor as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
      });
      sendResponse(res, 200, 'Activity history retrieved', history);
    } catch (error) {
      next(error);
    }
  }

  async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      // Placeholder for future implementation
      sendResponse(res, 200, 'Export functionality coming soon', {});
    } catch (error) {
      next(error);
    }
  }

  async exportPdf(req: Request, res: Response, next: NextFunction) {
    try {
      // Placeholder for future implementation
      sendResponse(res, 200, 'Export functionality coming soon', {});
    } catch (error) {
      next(error);
    }
  }
}

export const activityController = new ActivityController();
