import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "./config/database";
import { Course } from "./models/Course";
import { BookModel } from "./models/Book";
import { COURSES } from "./data/courses";
import { BOOKS } from "./data/books";

async function seed() {
  await connectDatabase();

  for (const course of COURSES) {
    await Course.updateOne({ code: course.code }, course, { upsert: true });
  }
  await Course.deleteOne({ code: "CSSWENG" });
  console.log(`${COURSES.length} courses in ${mongoose.connection.name}`);

  for (const book of BOOKS) {
    const { availableCopies, ...catalogFields } = book;
    await BookModel.updateOne(
      { title: book.title },
      {
        $set: catalogFields,
        // Stock is live catalog data; set its initial value only for new books.
        $setOnInsert: { availableCopies },
      },
      { upsert: true },
    );
  }
  console.log(`${BOOKS.length} books in ${mongoose.connection.name}`);

  await mongoose.disconnect();
}

seed().catch((err: unknown) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
