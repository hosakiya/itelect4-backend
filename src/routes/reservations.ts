import { Router, type Request, type Response } from "express";
import { ReservationModel } from "../models/Reservation";
import mongoose from "mongoose";
import { BookModel } from "../models/Book";
import { requireAuth } from "../middleware/auth";
import type {
  NewReservationBody,
  UpdateReservationBody,
} from "../types/index";

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
    if (purpose.length < 40 || purpose.length > 1000) {
      res.status(400).json({ message: "Please describe your borrowing purpose in at least a few sentences." });
      return;
    }

    const book = mongoose.Types.ObjectId.isValid(req.body.bookId)
      ? await BookModel.findById(req.body.bookId)
      : await BookModel.findOne({ legacyId: Number(req.body.bookId) });
    if (!book || book.availableCopies < quantity) {
      res.status(409).json({ message: "The requested number of copies is not currently available." });
      return;
    }

    const reservation = await ReservationModel.create({
      ...req.body,
      quantity,
      purpose,
      borrowingPeriod: "Confirm with LRC at checkout",
      userId: req.userId,
    });

    res.status(201).json(reservation);
  },
);

reservationRouter.patch(
  "/:id",
  async (
    req: Request<IdParam, unknown, UpdateReservationBody>,
    res: Response,
  ) => {
    const reservation = await ReservationModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: req.body },
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

    res.status(204).send();
  },
);
