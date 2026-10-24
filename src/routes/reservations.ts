import { Router, type Request, type Response } from "express";
import { ReservationModel } from "../models/Reservation";
import mongoose from "mongoose";
import { BookModel } from "../models/Book";
import { requireAuth } from "../middleware/auth";
import type {
  NewReservationBody,
  UpdateReservationBody,
} from "../types/index";
import { ReservationStatus } from "../types/index";

export const reservationRouter = Router();

reservationRouter.use(requireAuth);

interface IdParam {
  id: string;
}

reservationRouter.get("/", async (req: Request, res: Response) => {
  const reservations = await ReservationModel.find({
    userId: req.userId,
  }).sort({ reservedAt: -1 });
  res.json(reservations);
});

reservationRouter.get(
  "/:id",
  async (req: Request<IdParam>, res: Response) => {
    const reservation = await ReservationModel.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!reservation) {
      res.status(404).json({ message: "No reservation with that id" });
      return;
    }

    res.json(reservation);
  },
);

reservationRouter.post(
  "/",
  async (
    req: Request<unknown, unknown, NewReservationBody>,
    res: Response,
  ) => {
    const quantity = Number(req.body.quantity);
    const purpose = typeof req.body.purpose === "string" ? req.body.purpose.trim() : "";
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 3) {
      res.status(400).json({ message: "Choose between 1 and 3 copies." });
      return;
    }
    const purposeWords = purpose.split(/\s+/).filter(Boolean).length;
    if (purposeWords < 5 || purposeWords > 20 || purpose.length > 1000) {
      res.status(400).json({ message: "Purpose of borrowing must be 5 to 20 words." });
      return;
    }

    const book = mongoose.Types.ObjectId.isValid(req.body.bookId)
      ? await BookModel.findById(req.body.bookId)
      : await BookModel.findOne({ legacyId: Number(req.body.bookId) });
    if (!book) {
      res.status(404).json({ message: "This book could not be found in the catalog." });
      return;
    }

    const claimedBook = await BookModel.findOneAndUpdate(
      { _id: book._id, availableCopies: { $gte: quantity } },
      { $inc: { availableCopies: -quantity } },
      { new: true },
    );
    if (!claimedBook) {
      const latestBook = await BookModel.findById(book._id).select("availableCopies");
      res.status(409).json({
        message: latestBook?.availableCopies === 0
          ? "This book is out of stock."
          : "The requested number of copies is not currently available.",
      });
      return;
    }

    let reservation;
    try {
      reservation = await ReservationModel.create({
        ...req.body,
        quantity,
        purpose,
        borrowingPeriod: "Confirm with LRC at checkout",
        inventoryClaimed: true,
        userId: req.userId,
      });
    } catch (error) {
      await BookModel.updateOne({ _id: book._id }, { $inc: { availableCopies: quantity } });
      throw error;
    }

    res.status(201).json(reservation);
  },
);

reservationRouter.patch(
  "/:id",
  async (
    req: Request<IdParam, unknown, UpdateReservationBody>,
    res: Response,
  ) => {
    if (req.body.status === ReservationStatus.Cancelled) {
      const cancelledReservation = await ReservationModel.findOneAndUpdate(
        {
          _id: req.params.id,
          userId: req.userId,
          status: { $ne: ReservationStatus.Cancelled },
        },
        { $set: { status: ReservationStatus.Cancelled } },
        { new: false },
      );

      if (cancelledReservation) {
        if (cancelledReservation.inventoryClaimed) {
          await BookModel.updateOne(
            { _id: cancelledReservation.bookId },
            { $inc: { availableCopies: cancelledReservation.quantity || 1 } },
          );
        }
        res.json({ ...cancelledReservation.toJSON(), status: ReservationStatus.Cancelled });
        return;
      }

      const existingReservation = await ReservationModel.findOne({ _id: req.params.id, userId: req.userId });
      if (!existingReservation) {
        res.status(404).json({ message: "No reservation with that id" });
        return;
      }
      res.json(existingReservation);
      return;
    }

    if (req.body.status) {
      res.status(400).json({ message: "Reservation status can only be changed by the library." });
      return;
    }

    const updates: UpdateReservationBody = {};
    if (req.body.pickupDeadline !== undefined) updates.pickupDeadline = req.body.pickupDeadline;

    const reservation = await ReservationModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!reservation) {
      res.status(404).json({ message: "No reservation with that id" });
      return;
    }

    res.json(reservation);
  },
);

reservationRouter.delete(
  "/:id",
  async (req: Request<IdParam>, res: Response) => {
    const reservation = await ReservationModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!reservation) {
      res.status(404).json({ message: "No reservation with that id" });
      return;
    }

    if (reservation.status !== ReservationStatus.Cancelled && reservation.inventoryClaimed) {
      await BookModel.updateOne(
        { _id: reservation.bookId },
        { $inc: { availableCopies: reservation.quantity || 1 } },
      );
    }

    res.status(204).send();
  },
);
