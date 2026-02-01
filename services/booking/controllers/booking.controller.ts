import { Request, Response } from "express";
import BookingModel from "../models/booking.model";
import { publishBookingConfirmed } from "../kafka/booking.producer";
import { v4 as uuidv4 } from "uuid";
import logger from "../logs/logger";

export const createBooking = async (req: Request, res: Response) => {
  const { eventId, userId, seatCount, idempotencyKey } = req.body;
  const requestId = (req as any).requestId;

  logger.info("Processing booking", {
    requestId,
    eventId,
    userId,
    seatCount,
  });

  try {
    const bookingId = idempotencyKey || uuidv4();

    // Idempotency check
    const existing = await BookingModel.findByBookingId(bookingId);
    if (existing) {
      return res.status(200).json({
        booking: existing,
        message: "Duplicate request - returning existing booking",
      });
    }

    const booking = await BookingModel.bookSeatsAtomic({
      eventId,
      userId,
      seatCount,
      bookingId,
    });

    await publishBookingConfirmed(booking);

    logger.info("Booking confirmed", {
      requestId,
      bookingId: booking.booking_id,
    });

    res.status(201).json({ booking });
  } catch (error: any) {
    logger.error("Booking failed", {
      requestId,
      error: error.message,
      eventId,
      userId,
    });

    if (
      error.message.includes("Not enough seats") ||
      error.message.includes("Concurrent")
    ) {
      return res.status(409).json({ error: error.message });
    }

    res.status(500).json({ error: "Booking failed" });
  }
};
