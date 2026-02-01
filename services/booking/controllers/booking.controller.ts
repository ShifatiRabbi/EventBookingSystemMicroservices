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


export const getAllBookingData = async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;

  try {
    const bookings = await BookingModel.findAll();

    logger.info("Fetched all bookings", {
      requestId,
      count: bookings.length,
    });

    res.status(200).json({ bookings });
  } catch (error: any) {
    logger.error("Failed to fetch bookings", {
      requestId,
      error: error.message,
    });

    res.status(500).json({ error: "Failed to fetch bookings" });
  }
};

export const getSingleBookingData = async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const requestId = (req as any).requestId;

  try {
    const booking = await BookingModel.findByBookingId(bookingId);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    logger.info("Fetched booking", {
      requestId,
      bookingId,
    });

    res.status(200).json({ booking });
  } catch (error: any) {
    logger.error("Failed to fetch booking", {
      requestId,
      bookingId,
      error: error.message,
    });

    res.status(500).json({ error: "Failed to fetch booking" });
  }
};