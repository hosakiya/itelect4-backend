import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import { BookModel } from "../models/Book";

export const bookRouter = Router();

// Public route: list all books
// GET /api/books
bookRouter.get("/", async (_req: Request, res: Response) => {
  const books = await BookModel.find().sort({ title: 1 });
  res.json(books);
});

interface IdParam {
  id: string;
}

// Public route: get one book by id (MongoDB ObjectId, legacyId number, or title)
// GET /api/books/:id
bookRouter.get("/:id", async (req: Request<IdParam>, res: Response) => {
  const { id } = req.params;

  let book = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    book = await BookModel.findById(id);
  }

  if (!book && !isNaN(Number(id))) {
    book = await BookModel.findOne({ legacyId: Number(id) });
  }

  if (!book) {
    book = await BookModel.findOne({ title: id });
  }

  if (!book) {
    res.status(404).json({
      message: `No book with id "${req.params.id}"`,
    });
    return;
  }

  res.json(book);
});
