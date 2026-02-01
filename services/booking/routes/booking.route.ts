import { Router } from "express";
import { createBooking, getAllBookingData, getSingleBookingData } from "../controllers/booking.controller";

const router = Router();

router.post("/", createBooking);
router.get("/", getAllBookingData);
router.get("/:id", getAllBookingData);

export default router;
