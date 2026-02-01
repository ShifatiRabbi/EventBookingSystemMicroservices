import { Router } from "express";
import {
  createNewEvent,
  getEventData,
  updateEvent,
  getAllEventData
} from "./../controllers/event.controller";
import { cacheController } from "../controllers/cache.controller";

const router = Router();

router.post("/", createNewEvent);
router.get("/", getAllEventData);
router.get("/:id", cacheController("event", 30), getEventData);
router.put("/:id", updateEvent);

export default router;
