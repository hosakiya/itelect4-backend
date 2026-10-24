import { Schema, model } from "mongoose";
import type { BookDoc } from "../types/index";

const bookSchema = new Schema<BookDoc>({
  title: {
    type: String,
    required: [true, "title is required"],
    trim: true,
  },
  author: {
    type: String,
    required: [true, "author is required"],
    trim: true,
  },
  genre: {
    type: String,
    required: [true, "genre is required"],
    trim: true,
  },
  availableCopies: {
    type: Number,
    required: true,
    min: 0,
    default: 1,
  },
  totalCopies: {
    type: Number,
    min: 0,
    default: 1,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  legacyId: {
    type: Number,
    index: true,
  },
});

bookSchema.set("toJSON", {
  transform(_doc, ret: Record<string, unknown>) {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const BookModel = model<BookDoc>("Book", bookSchema);
