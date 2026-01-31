import { Request, Response } from "express";
import UserModel from "../models/user.model";
import logger from "../logs/logger";

interface UserParams {
  id: string;
}

export const createNewUser = async (req: Request, res: Response) => {
  const { name, email } = req.body;
  const requestId = (req as any).requestId;

  logger.info("Creating user", { requestId, email });

  try {
    const user = await UserModel.createUser(name, email);
    res.status(201).json({ user });
  } catch (error: any) {

    logger.error("Error creating user", {
      requestId,
      error: error.message,
    });

    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;

  logger.info("Fetching all users", { requestId });

  try {
    const users = await UserModel.getAllUsers();
    res.status(200).json({ users });
  } catch (error: any) {
    logger.error("Error fetching users", {
      requestId,
      error: error.message,
    });

    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserData = async (req: Request<UserParams>, res: Response) => {
  const { id } = req.params;
  const requestId = (req as any).requestId;

  try {
    const user = await UserModel.getUserById(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error: any) {
    logger.error("Error fetching user", {
      requestId,
      userId: id,
      error: error.message,
    });

    res.status(500).json({ error: "Internal server error" });
  }
};
