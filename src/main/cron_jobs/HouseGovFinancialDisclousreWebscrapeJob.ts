import CronJob, {CronJobRunReport} from "./CronJob";
import {injectable, singleton} from "tsyringe";
import LoggerFactory, {Logger} from "../LoggerFactory";
import HouseGovDisclosureDownloadTask from "../cron_tasks/HouseGovDisclosureDownloadTask";
import HouseGovDisclosureDataInterpreterTask from "../cron_tasks/HouseGovDisclosureDataInterpreterTask";

@singleton()
@injectable()
export default class HouseGovFinancialDisclousreWebscrapeJob extends CronJob {
    private logger: Logger;

    private downloadTask: HouseGovDisclosureDownloadTask;
    private interpreterTask: HouseGovDisclosureDataInterpreterTask;

    public className = this.constructor.name;
    public cronSchedule = "0 4 * * *";

    constructor(
        loggerFactory: LoggerFactory,
        downloadTask: HouseGovDisclosureDownloadTask,
        interpreterTask: HouseGovDisclosureDataInterpreterTask
    ) {
        super();

        this.logger = loggerFactory.createPrivateClassLogger(this.className);
        this.downloadTask = downloadTask;
        this.interpreterTask = interpreterTask;
    }

    public async run() {
        const startTime = new Date().toISOString();
        this.logger.info(`Beginning Job at: ${new Date().toISOString()}`);

        this.logger.info("Download Task Starting...");
        const downloadTaskStats = await this.downloadTask.execute();

        this.logger.info("Interpret Task Starting...");
        const interpretTaskStats = await this.interpreterTask.execute();

        const endTime = new Date().toISOString();
        this.logger.info(`Ending Job at: ${new Date().toISOString()}`);

        const jobRunData = {
            jobName: this.className,
            startTime: startTime,
            endTime: endTime,
            taskRunStatReports: [downloadTaskStats.generateReportSummary(), interpretTaskStats.generateReportSummary()]
        } as CronJobRunReport;

        this.logger.info(jobRunData);

        return jobRunData;
    }

};



