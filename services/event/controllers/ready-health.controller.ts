import { Request, Response } from "express";
import logger from "../logs/logger";
import dbPool from "../config/db";


export const getReady = async (req: Request, res: Response) => {
    try {
        await dbPool.query('SELECT 1');
        res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(503).json({ status: 'not ready', error: error });
    }
};

export const getHealth = async (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
};
