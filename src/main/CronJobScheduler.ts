import cronParser from "cron-parser";
import {injectable, singleton} from "tsyringe";
import LoggerFactory, {Logger} from "./LoggerFactory";
import {schedule, ScheduledTask as ScheduledJob} from "node-cron";
import HouseGovFinancialDisclousreWebscrapeJob from "./cron_jobs/HouseGovFinancialDisclousreWebscrapeJob";
import {CronJobRunReport} from "./cron_jobs/CronJob";

interface ExtendedScheduledJob extends ScheduledJob {
    cronSchedule: string;
    jobName: string;
}

class CronJobSchedulerError extends Error {
    constructor(message: string) {
        super();
        this.message = message;
    }
}

@singleton()
@injectable()
export default class CronJobScheduler {
    private logger: Logger;
    private retentionPolicyDays: number = 30;
    // saves the last 30 days of task run data for each job
    private jobRunReportHistoryMap: Map<string, CronJobRunReport[]> = new Map();
    // saves the node-cron ScheduledJob instance
    private jobScheduleMap: Map<string, ExtendedScheduledJob> = new Map();

    private houseGovFinancialDisclousreWebscrapeJob: HouseGovFinancialDisclousreWebscrapeJob;

    constructor(
        logger: LoggerFactory,
        houseGovFinancialDisclousreWebscrapeJob: HouseGovFinancialDisclousreWebscrapeJob
    ) {
        this.logger = logger.createPrivateClassLogger(this.constructor.name);
        this.houseGovFinancialDisclousreWebscrapeJob = houseGovFinancialDisclousreWebscrapeJob;
    }

    private addJobRunDataToHistory(jobName: string, taskRunData: CronJobRunReport) {
        if (!this.jobRunReportHistoryMap.has(jobName)) {
            this.jobRunReportHistoryMap.set(jobName, []);
        }

        const taskRunDataHistory = this.jobRunReportHistoryMap.get(jobName)!;
        // descending order, most recent at index 0
        taskRunDataHistory.sort((a, b) => {
            return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
        });

        // NOTE: This is a circular buffer with a 30-day retention policy.
        if (taskRunDataHistory.length > this.retentionPolicyDays) {
            // remove the oldest task run data
            taskRunDataHistory.pop();
        }

        this.logger.info(`Adding task run data to history for task: ${jobName}`);
        taskRunDataHistory.push(taskRunData);
    }

    /**
     * getJobRunHistory
     * ----------------
     * Returns the task run history for a given job name. If no history is found, an empty array is returned.
     * Only the last 30 days of history are retained.
     *
     * @param jobName The name of the job to get the run history for.
     */
    public getJobRunHistory(jobName: string) {
        this.logger.info(`Getting job run history for job: ${jobName}`);
        if (!this.jobRunReportHistoryMap.has(jobName)) {
            this.logger.warn(`No history found for job: ${jobName}`);
            return [];
        }

        return this.jobRunReportHistoryMap.get(jobName)!;
    }

    /**
     * getAllJobRunHistory
     * -------------------
     * Returns all task run history for all jobs. If no history is found, an empty array is returned.
     * Only the last 30 days of history are retained.
     *
     * @returns An array of task run data for all jobs.
     */
    public getAllJobRunHistory() {
        this.logger.info(`Getting all job run history`);
        const allJobRunHistory = [];

        for (const [jobName, jobRunReportHistory] of this.jobRunReportHistoryMap.entries()) {
            allJobRunHistory.push(jobRunReportHistory);
        }

        return allJobRunHistory;
    }

    // TODO: Create start and stop methods for the cron jobs

    /**
     * executeJobNow
     * -------------
     * Executes a job immediately. This is useful for testing or debugging.
     *
     * @param jobName The name of the job to execute immediately
     */
    public async executeJobNow(jobName: string) {
        this.logger.info(`Executing job now: ${jobName}`);

        switch (jobName) {
            case this.houseGovFinancialDisclousreWebscrapeJob.className:
                const jobRunReport = await this.houseGovFinancialDisclousreWebscrapeJob.run();
                this.addJobRunDataToHistory(this.houseGovFinancialDisclousreWebscrapeJob.className, jobRunReport);
                break;
            default:
                throw new Error(`Job not found: ${jobName}`);
        }
    }

    /**
     * getScheduledJobInfo
     * -------------------
     * TODO: Use different cron library since this one doesn't show the nextRun date correctly.
     * */
    public getScheduledJobInfo(jobName: string) {
        const jobSchedule = this.jobScheduleMap.get(jobName);
        if (!jobSchedule) {
            throw new CronJobSchedulerError(`CronJob with name: ${jobName} not in schedule map.`);
        }

        // Use cron-parser to calculate the next execution time
        const interval = cronParser.parseExpression(jobSchedule.cronSchedule);
        const nextRun = interval.next().toDate();

        // Calculate the time difference in milliseconds
        const currentTime = new Date();
        const timeDiff = nextRun.getTime() - currentTime.getTime();

        // Return the time until the next job run in milliseconds
        const nextRunDHMS = convertMillisecondsToDHMS(timeDiff >= 0 ? timeDiff : 0); // Ensure it does not return negative time

        return {
            jobName,
            cronSchedule: jobSchedule.cronSchedule,
            nextRun,
            message: `Next run in ${nextRunDHMS.days} days ${nextRunDHMS.hours} hours ${nextRunDHMS.minutes} minutes and ${nextRunDHMS.seconds} seconds`
        };

        function convertMillisecondsToDHMS(milliseconds: number): { days: number, hours: number, minutes: number, seconds: number } {
            const seconds = Math.floor((milliseconds / 1000) % 60);
            const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
            const hours = Math.floor((milliseconds / (1000 * 60 * 60)) % 24);
            const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));

            return { days, hours, minutes, seconds };
        }
    }

    /**
     * scheduleJobs
     * ------------------------------
     * Schedules the house gov disclosure cron task to run daily at 4am. It downloads the latest
     * house gov financial disclosures and interprets the data, then stores that data in a postgresql
     * database.
     */
    public async scheduleJobs() {
        // TODO: formalize when more than one job
        const AListOfJobs = [this.houseGovFinancialDisclousreWebscrapeJob.className];

        AListOfJobs.forEach(jobName => {
            this.logger.info(`Now Scheduling Job ${jobName}`);
            switch (jobName) {
                case this.houseGovFinancialDisclousreWebscrapeJob.className:
                    const newJobSchedule = schedule(this.houseGovFinancialDisclousreWebscrapeJob.cronSchedule, async () => {
                        const jobRunReport = await this.houseGovFinancialDisclousreWebscrapeJob.run();
                        this.addJobRunDataToHistory(this.houseGovFinancialDisclousreWebscrapeJob.className, jobRunReport);
                    }) as ExtendedScheduledJob;
                    newJobSchedule.jobName = jobName;
                    newJobSchedule.cronSchedule = this.houseGovFinancialDisclousreWebscrapeJob.cronSchedule;
                    // register new schedule to internal map
                    this.jobScheduleMap.set(jobName, newJobSchedule);
                    break;
                default:
                    this.logger.info(`Configurations for setting up job ${jobName} not found.`);
            }
        });
    }
}
