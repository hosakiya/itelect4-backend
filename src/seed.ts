import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "./config/database";
import { Course } from "./models/Course";
import { BookModel } from "./models/Book";
import { ReservationModel } from "./models/Reservation";
import { COURSES } from "./data/courses";
import { BOOKS } from "./data/books";

async function seed() {
  await connectDatabase();

  for (const course of COURSES) {
    await Course.updateOne({ code: course.code }, course, { upsert: true });
  }
  await Course.deleteOne({ code: "CSSWENG" });
  console.log(`${COURSES.length} courses in ${mongoose.connection.name}`);

  const activeClaims = await ReservationModel.aggregate<{
    _id: mongoose.Types.ObjectId;
    quantity: number;
  }>([
    { $match: { inventoryClaimed: true, status: { $ne: "cancelled" } } },
    { $group: { _id: "$bookId", quantity: { $sum: { $ifNull: ["$quantity", 1] } } } },
  ]);
  const claimedCopiesByBookId = new Map(
    activeClaims.map((claim) => [String(claim._id), claim.quantity]),
  );

  for (const book of BOOKS) {
    const { availableCopies: totalCopies, ...catalogFields } = book;
    const existingBook = await BookModel.findOne({ title: book.title }).select("_id");
    const activeClaimedCopies = existingBook
      ? claimedCopiesByBookId.get(String(existingBook._id)) ?? 0
      : 0;
    const availableCopies = Math.max(0, totalCopies - activeClaimedCopies);
    await BookModel.updateOne(
      { title: book.title },
      {
        $set: { ...catalogFields, totalCopies, availableCopies },
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
