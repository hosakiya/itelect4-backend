import { Schema, model } from "mongoose";
import { ReservationStatus, type ReservationDoc } from "../types/index";

const reservationSchema = new Schema<ReservationDoc>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  bookId: {
    type: Schema.Types.ObjectId,
    ref: "Book",
    required: [true, "bookId is required"],
  },
  status: {
    type: String,
    enum: Object.values(ReservationStatus),
    default: ReservationStatus.Pending,
    required: true,
  },
  reservedAt: { type: Date, default: Date.now, required: true },
  pickupDeadline: {
    type: Date,
    min: [new Date(), "pickupDeadline must not be in the past"],
  },
});

reservationSchema.set("toJSON", {
  transform(_doc, ret: Record<string, unknown>) {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const ReservationModel = model<ReservationDoc>(
  "Reservation",
  reservationSchema,
);
