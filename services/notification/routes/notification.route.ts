import { Router } from "express";
import { getNotifications, createNotification } from "../controllers/notification.controller";

const router = Router();

router.get("/", getNotifications);
router.post("/", createNotification);

export default router;
