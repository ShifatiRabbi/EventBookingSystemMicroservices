import { Request, Response } from "express";
import EventModel from "../models/event.model";
import redisClient from "../cache/redis";
import logger from "../logs/logger";

interface EventParams {
  id: string;
}

export const getAllEventData = async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;

  try {
    const events = await EventModel.getAllEvents();

    logger.info("Fetched all events", {
      requestId,
      count: events.length,
    });

    res.status(200).json({ events });
  } catch (error: any) {
    logger.error("Error fetching events", {
      requestId,
      error: error.message,
    });

    res.status(500).json({ error: "Internal server error" });
  }
};

export const createNewEvent = async (req: Request, res: Response) => {
  const { title, totalSeats, date } = req.body;
  const requestId = (req as any).requestId;

  logger.info("Creating event", { requestId, title });

  try {
    const event = await EventModel.createEvent(
      title,
      totalSeats,
      date
    );

    res.status(201).json({ event });
  } catch (error: any) {
    logger.error("Error creating event", {
      requestId,
      error: error.message,
    });

    res.status(500).json({ error: "Internal server error" });
  }
};

export const getEventData = async (
  req: Request<EventParams>,
  res: Response
) => {
  const { id } = req.params;
  const requestId = (req as any).requestId;

  try {
    const event = await EventModel.getEventById(id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.status(200).json({ event });
  } catch (error: any) {
    logger.error("Error fetching event", {
      requestId,
      eventId: id,
      error: error.message,
    });

    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateEvent = async (
  req: Request<EventParams>,
  res: Response
) => {
  const { id } = req.params;
  const updates = req.body;
  const requestId = (req as any).requestId;

  logger.info("Updating event", { requestId, eventId: id });

  try {
    const event = await EventModel.updateEventById(id, updates);

    if (!event) {
      return res.status(400).json({ error: "No fields to update" });
    }

    // Invalidate cache
    await redisClient.del(`event:${id}`);

    res.status(200).json({ event });
  } catch (error: any) {
    logger.error("Error updating event", {
      requestId,
      eventId: id,
      error: error.message,
    });

    res.status(500).json({ error: "Internal server error" });
  }
};
