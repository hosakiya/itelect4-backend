import { Router, type Request, type Response } from "express";
import { Course } from "../models/Course";

export const courseRouter = Router();

// GET /api/courses
courseRouter.get("/", async (_req: Request, res: Response) => {
  const courses = await Course.find().sort({ code: 1 });
  res.json(courses);
});

interface CodeParam {
  code: string;
}

// GET /api/courses/:code
courseRouter.get(
  "/:code",
  async (req: Request<CodeParam>, res: Response) => {
    const course = await Course.findOne({
      code: req.params.code.toUpperCase(),
    });

    if (!course) {
      res.status(404).json({
        message: `No course with code "${req.params.code}"`,
      });
      return;
    }

    res.json(course);
  },
);
