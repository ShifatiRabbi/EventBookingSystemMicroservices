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
