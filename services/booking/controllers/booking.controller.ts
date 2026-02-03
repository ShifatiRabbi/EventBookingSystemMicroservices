import { Request, Response } from "express";
import axios from "axios";
import BookingModel from "../models/booking.model";
import { publishBookingConfirmed } from "../kafka/booking.producer";
import { v4 as uuidv4 } from "uuid";
import logger from "../logs/logger";

// fetch event data from event service
async function fetchEvent(eventId: string) {
  try {
    const response = await axios.get(`http://event-service:3002/api/events/${eventId}`);
    return response.data.event;
  } catch (error: any) {
    logger.error("Failed to fetch event from event service", {
      eventId,
      error: error.message,
    });
    throw new Error("Event service unreachable or event not found");
  }
}

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
    // Fetch event
    const event = await fetchEvent(eventId);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (event.available_seats < seatCount) {
      return res.status(409).json({ error: "Not enough seats available" });
    }

    const bookingId = idempotencyKey || uuidv4();

    // Idempotency check
    const existing = await BookingModel.findByBookingId(bookingId);
    if (existing) {
      return res.status(200).json({
        booking: existing,
        message: "Duplicate request - returning existing booking",
      });
    }

    // Reserve seats via Event Service
    await axios.post(
      `http://event-service:3002/api/events/${eventId}/reserve`,
      { seatCount }
    );

    let booking;

    try {
      booking = await BookingModel.bookSeatsAtomic({
        eventId,
        userId,
        seatCount,
        bookingId,
      });
    } catch (err) {
      // COMPENSATION
      await axios.post(
        `http://event-service:3002/api/events/${eventId}/release`,
        { seatCount }
      );
      throw err;
    }

    // after booking is created
    try {
      await publishBookingConfirmed(booking);
    } catch (err) {
      logger.error("Kafka publish failed", {
        bookingId: booking.booking_id,
        error: (err as any).message,
      });
    }

    res.status(201).json({ booking });
    logger.info("Booking confirmed", {
      requestId,
      bookingId,
    });

  } catch (error: any) {
    logger.error("Booking failed", {
      requestId,
      error: error.message,
    });

    if (error.response?.status === 409) {
      return res.status(409).json({ error: "Seat reservation failed" });
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