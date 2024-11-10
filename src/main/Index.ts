import 'reflect-metadata';
import express from 'express';
import { container } from 'tsyringe';
import LoggerFactory from './LoggerFactory';
import CronJobScheduler from './CronJobScheduler';
import CronJobSchedulerHttpApiController from './http_controllers/CronJobSchedulerHttpApiController';

async function main() {
    const logger = container.resolve(LoggerFactory).createPrivateClassLogger("Index.ts");
    const cronJobScheduler = container.resolve(CronJobScheduler);

    const conJobSchedulerHttpApiController = container.resolve(CronJobSchedulerHttpApiController);
    
    const server = express();

    // Built-in middleware for parsing JSON request bodies
    server.use(express.json());

    // Built-in middleware for parsing URL-encoded request bodies
    server.use(express.urlencoded({ extended: true }));

    server.get('/', (req, res) => {
        res.send({
            message: 'Trade Machine V2 API'
        });
    });

    server.use(async (req, res, next) => {
        logger.info(`Request received: ${req.method} ${req.url}`);
        next();
    });

    server.use(conJobSchedulerHttpApiController.path, conJobSchedulerHttpApiController.router);

    server.listen(8080, async () => {
        logger.info('Server started on port 8080');

        await cronJobScheduler.scheduleJobs();
    });
}

(() => main())();
