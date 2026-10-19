import { Schema, model } from "mongoose";
import type { CourseDoc } from "../types/index";

const courseSchema = new Schema<CourseDoc>({
  code: {
    type: String,
    required: [true, "code is required"],
    unique: true,
    uppercase: true,
    trim: true,
  },
  title: { type: String, required: [true, "title is required"], trim: true },
  semester: { type: String, required: true, trim: true },
});

courseSchema.set("toJSON", {
  transform(_doc, ret: Record<string, unknown>) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Course = model<CourseDoc>("Course", courseSchema);
