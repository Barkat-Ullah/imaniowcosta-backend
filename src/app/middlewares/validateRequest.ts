import { NextFunction, Request, Response } from 'express';
import { AnyZodObject } from 'zod';

const body =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let data = req.body;

      // 🔥 multipart/form-data case
      if (req.body?.data) {
        data = JSON.parse(req.body.data);
      }

      await schema.parseAsync(data);
      next();
    } catch (err) {
      next(err);
    }
  };

const query =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.query);
      next();
    } catch (err) {
      next(err);
    }
  };

const validateRequest = { body, query };
export default validateRequest;
