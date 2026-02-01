import { Router } from "express";
import { getNotifications } from "../controllers/notification.controller";

const router = Router();

router.get("/", getNotifications);

export default router;
