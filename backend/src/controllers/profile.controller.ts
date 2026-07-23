import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/response';
import { profileService } from '../services/profile.service';
import { profileAnalyticsService } from '../services/profile-analytics.service';
import { timelineService } from '../services/timeline.service';

export class ProfileController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await profileService.getProfile(res.locals.user.id);
      sendResponse(res, 200, 'Profile retrieved', { user });
    } catch (error) {
      next(error);
    }
  }

  async getPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const prefs = await profileService.getPreferences(res.locals.user.id);
      sendResponse(res, 200, 'Preferences retrieved', { preferences: prefs });
    } catch (error) {
      next(error);
    }
  }

  async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const prefs = await profileService.updatePreferences(res.locals.user.id, req.body);
      sendResponse(res, 200, 'Preferences updated', { preferences: prefs });
    } catch (error) {
      next(error);
    }
  }
}

export class AnalyticsController {
  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const kpis = await profileAnalyticsService.getSummary(res.locals.user.id, res.locals.user.role);
      sendResponse(res, 200, 'Analytics retrieved', { analytics: kpis });
    } catch (error) {
      next(error);
    }
  }
}

export class TimelineController {
  async getTimeline(req: Request, res: Response, next: NextFunction) {
    try {
      const milestones = await timelineService.getMilestones(res.locals.user.id);
      sendResponse(res, 200, 'Timeline retrieved', { timeline: milestones });
    } catch (error) {
      next(error);
    }
  }
}

export const profileController = new ProfileController();
export const analyticsController = new AnalyticsController();
export const timelineController = new TimelineController();
