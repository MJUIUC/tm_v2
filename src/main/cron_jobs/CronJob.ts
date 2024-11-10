import {TaskRunStatsCollectorReport} from "../cron_tasks/TaskRunStatsCollector";

export interface CronJobRunReport {
    jobName: string;
    startTime: string;
    endTime: string;
    // reports from whatever tasks were involved in the cron job
    taskRunStatReports: TaskRunStatsCollectorReport[];
}

export default abstract class CronJob {
    public abstract run(): Promise<void | CronJobRunReport>;
}