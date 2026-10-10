import { Router, type Request, type Response } from "express";
import { ReservationModel } from "../models/Reservation";
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
    const reservation = await ReservationModel.create({
      ...req.body,
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
