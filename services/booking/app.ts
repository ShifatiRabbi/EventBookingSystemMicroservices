import express from 'express';
// import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import userRoute from './routes/user.route'
import readyHealth from './routes/ready-health.route'
import config from './config/config'
import logger from "./logs/logger";


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request ID middleware
app.use((req, res, next) => {
    const requestId = req.headers['x-request-id'] || uuidv4();
    res.setHeader('X-Request-ID', requestId as string);
    (req as any).requestId = requestId;
    next();
});

app.use("/api/users", userRoute);
app.use("/", readyHealth);

// Handle routes error
app.use((req, res, next) => {
    res.status(404).json({
        message: "Url not found !!!"
    });
});

app.listen(config.app.port, () => {
    logger.info(`User service running on port ${config.app.port}`);
    console.log(`User server running on port http://localhost:${config.app.port}`);
});