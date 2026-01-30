import { Router } from "express";
import {
  getUserData,
  createNewUser,
} from "../controllers/user.controller";

const router = Router();

// router.get("/", getAllUsers);
router.get("/:id", getUserData);
router.post("/", createNewUser);

export default router;
