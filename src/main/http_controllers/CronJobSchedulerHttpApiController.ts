import {injectable, singleton} from 'tsyringe';
import HttpApiController from './HttpApiController';
import LoggerFactory, {Logger} from '../LoggerFactory';
import CronJobScheduler from '../CronJobScheduler';
import {Request, Response} from 'express';
import {CronJobRunReport} from "../cron_jobs/CronJob";

// TODO: Create pause and start POST requests for the cron job scheduler

@singleton()
@injectable()
export default class CronJobSchedulerHttpApiController extends HttpApiController {
    public path: string = "/cron-job-scheduler";

    private logger: Logger;
    private cronJobScheduler: CronJobScheduler;

    constructor(
        logger: LoggerFactory,
        cronJobScheduler: CronJobScheduler
    ) {
        super();

        this.cronJobScheduler = cronJobScheduler;
        this.logger = logger.createPrivateClassLogger(this.constructor.name);
        this.logger.info("CronJobSchedulerHttpApiController initialized");
    }

    public override initRoutes(): void {
        this.router.get("/all-job-run-history", this.getAllJobRunHistory.bind(this));
        this.router.get("/scheduled-job-info", this.scheduledJobInfo.bind(this));
        this.router.post("/execute-job-now", this.executeJobNow.bind(this));
    }

    private async scheduledJobInfo(req: Request, res: Response) {
        const { jobName } = req.query;

        try {
            if (!jobName) {
                res.status(400).send({
                    message: "missing job name in request"
                });
                return;
            }

            res.status(200).send(this.cronJobScheduler.getScheduledJobInfo(jobName as string));
        } catch (e) {
            this.logger.error(e);
            res.status(500).send({
                message: "Internal Server Error"
            });
        }
    }

    private async executeJobNow(req: Request, res: Response) {
        const { jobName } = req.body;

        try {
            // @ts-ignore No need to halt request on the job finishing
            this.cronJobScheduler.executeJobNow(jobName);

            res.status(201).send({
                message: `Executing job: ${jobName}`,
            });
        } catch (error) {
            this.logger.error(`Error executing job now: ${jobName}`, error);
            res.status(500).send({error: (error as Error).message});
        }

    }

    private async getAllJobRunHistory(_req: Request, res: Response) {
        this.logger.info("Getting all job run history");
        const AllJobRunHistory = this.cronJobScheduler.getAllJobRunHistory();

        const sortedReports = AllJobRunHistory.map(singleJobRunHistory => {
            return singleJobRunHistory.sort((jobRunA: CronJobRunReport, jobRunB: CronJobRunReport) => {
                const a = new Date(jobRunA.startTime);
                const b = new Date(jobRunB.startTime);
                return a.getTime() - b.getTime();
            })
        });

        res.status(200).send(sortedReports);
    }
}