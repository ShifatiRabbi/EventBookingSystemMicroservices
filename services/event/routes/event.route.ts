import { Router } from "express";
import {
  createNewEvent,
  getEventData,
  updateEvent,
  getAllEventData,
  reserveEventSeats,
  releaseEventSeats
} from "./../controllers/event.controller";
import { cacheController } from "../controllers/cache.controller";

const router = Router();

router.post("/", createNewEvent);
router.get("/", getAllEventData);
router.get("/:id", cacheController("event", 30), getEventData);
router.put("/:id", updateEvent);
router.post("/:id/reserve", reserveEventSeats);
router.post("/:id/release", releaseEventSeats);

export default router;
