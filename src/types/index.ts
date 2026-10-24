import type { Types } from "mongoose";

export interface User {
  id:       number;
  name:     string;
  email:    string;
  role:     "student" | "librarian" | "admin";
  isActive: boolean;
  score:    number;
}

export interface Course {
  title:    string;
  code:     string;
  semester: string;
}

export interface Submission {
  id:          number;
  studentId:   number;
  courseId:    number;
  status:      "draft" | "submitted" | "reviewed";
  submittedAt?: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  genre: string;
  availableCopies: number;
  description: string;
}

export enum ReservationStatus {
  Pending = "pending",
  Approved = "approved",
  Completed = "completed",
  Cancelled = "cancelled",
}

export interface Reservation {
  id: number;
  userId: number;
  bookId: number;
  status: ReservationStatus;
  reservedAt: string;
  pickupDeadline?: string;
  quantity: number;
  purpose: string;
  borrowingPeriod: string;
}

export interface Review {
  id: number;
  reservationId: number;
  authorId: number;
  note: string;
  rating: 1 | 2 | 3 | 4 | 5;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export type BookSummary = Pick<Book, "id" | "title" | "author">;
export type ReservationDraft = Omit<Reservation, "id" | "status">;
export type UserUpdate = Partial<User>;
export type ReservationLookup = Record<number, Reservation>;

export type UserDoc = Omit<User, "id"> & {
  password: string;
};

export type ReservationDoc = Omit<
  Reservation,
  "id" | "userId" | "bookId" | "reservedAt" | "pickupDeadline"
> & {
  userId: Types.ObjectId;
  bookId: Types.ObjectId;
  reservedAt: Date;
  pickupDeadline?: Date;
};

export interface NewReservationBody {
  bookId: string;
  pickupDeadline?: string;
  quantity: number;
  purpose: string;
}

export interface UpdateReservationBody {
  bookId?: string;
  status?: ReservationStatus;
  pickupDeadline?: string;
}

export type CourseDoc = Pick<
  Course,
  "code" | "title" | "semester"
>;

export type BookDoc = Pick<
  Book,
  "title" | "author" | "genre" | "availableCopies" | "description"
> & {
  legacyId?: number;
};
