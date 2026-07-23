import { Request, Response, NextFunction } from 'express';
import { versionService } from '../services/version.service';
import { sendResponse } from '../utils/response';

export class VersionController {
  
  async getVersions(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const versions = await versionService.getVersions(id);
      sendResponse(res, 200, 'Versions retrieved', versions);
    } catch (error) {
      next(error);
    }
  }

  async getVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, versionNumber } = req.params;
      const version = await versionService.getVersion(id, parseInt(versionNumber));
      sendResponse(res, 200, 'Version retrieved', version);
    } catch (error) {
      next(error);
    }
  }

  async compareVersions(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const v1 = parseInt(req.query.v1 as string);
      const v2 = parseInt(req.query.v2 as string);

      if (!v1 || !v2) {
        return res.status(400).json({ success: false, message: 'v1 and v2 query parameters are required' });
      }

      const comparison = await versionService.compareVersions(id, v1, v2);
      sendResponse(res, 200, 'Versions compared', comparison);
    } catch (error) {
      next(error);
    }
  }
}

export const versionController = new VersionController();
