import { Router } from "express";
import {
  getReady,
  getHealth,
} from "../controllers/ready-health.controller";

const router = Router();

router.get("/ready", getReady);
router.get("/health", getHealth);

export default router;
