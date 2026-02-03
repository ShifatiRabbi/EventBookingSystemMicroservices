import { Request, Response } from "express";
import NotificationModel from "../models/notification.model";
import logger from "../logs/logger";

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await NotificationModel.getLatestNotifications(100);
    res.status(200).json({ notifications });
  } catch (error: any) {
    logger.error("Error fetching notifications", {
      error: error.message,
    });
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createNotification = async (req: Request, res: Response) => {
  try {
    const { messageId, bookingId, userId, eventId, message } = req.body;

    if (!messageId || !bookingId || !userId || !eventId || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const exists = await NotificationModel.existsByMessageId(messageId);
    if (exists) {
      return res.status(409).json({ error: "Duplicate notification" });
    }

    await NotificationModel.createNotification({
      messageId,
      bookingId,
      userId,
      eventId,
      message,
    });

    res.status(201).json({ message: "Notification created successfully" });
  } catch (error: any) {
    logger.error("Failed to create notification", {
      error: error.message,
    });
    res.status(500).json({ error: "Internal server error" });
  }
};
