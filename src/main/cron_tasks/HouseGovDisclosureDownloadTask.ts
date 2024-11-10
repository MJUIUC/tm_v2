import TaskBase from './TaskBase';
import path from 'path';
import LoggerFactory, {Logger} from '../LoggerFactory';
import {injectable, singleton} from 'tsyringe';
import HouseGovFullDisclosureReportDownloader, {
    HouseGovFinancialDisclosure
} from '../webscraping/HouseGovFullDisclosureReportDownloader';
import HouseGovFullDisclosureReportReader from '../webscraping/HouseGovFullDisclosureReportReader';
import PrismaClient from '../PrismaClient';
import TaskRunStatsCollector from './TaskRunStatsCollector';

@singleton()
@injectable()
export default class HouseGovDisclosureDownloadTask extends TaskBase {

    private prisma: PrismaClient;
    private logger: Logger;
    private houseGovScraper: HouseGovFullDisclosureReportDownloader;
    private disclosureReportReader: HouseGovFullDisclosureReportReader;

    constructor(
        prisma: PrismaClient,
        logger: LoggerFactory,
        houseGovScraper: HouseGovFullDisclosureReportDownloader,
        disclosureReportReader: HouseGovFullDisclosureReportReader
    ) {
        super();
        this.prisma = prisma;
        this.logger = logger.createPrivateClassLogger(this.constructor.name);
        this.houseGovScraper = houseGovScraper;
        this.disclosureReportReader = disclosureReportReader;
    }

    /**
     * run
     * ---
     * This job downloads the full disclosure report zip file for the current year, unzips it, parses the xml file, and
     * downloads the periodic transaction report pdf for each disclosure. It then reads the full disclosure report pdf
     * and saves it as a text file. All outputs are saved to the './downloads' directory.
    */
    public async execute(): Promise<TaskRunStatsCollector> {
        const currentYear = new Date().getFullYear().toString();
        const downlaodDir = path.resolve(__dirname, "..", "..", "downloads");
        const pdfDir = path.resolve(downlaodDir, currentYear, "pdf");
        
        // Job stats map. Contains all stats for the job run and returns a report of the stats to the scheduler.
        const jobRunStatsMap = new TaskRunStatsCollector(`${this.constructor.name}Stats`);

        try {
            // Download the zip file for the full disclosure report for the current year
            const pathToZip = await this.houseGovScraper.downloadFullDisclosureReportZip(currentYear, downlaodDir);
            const FinancialDisclosures: HouseGovFinancialDisclosure[] = await this.houseGovScraper.unzipAndParseFullDisclosureReportZip(currentYear, pathToZip);
            
            this.logger.info(`Found ${FinancialDisclosures.length} disclosures in the full disclosure report zip file`);
            await new Promise((resolve) => setTimeout(resolve, 5*1000));

            for (const disclosure of FinancialDisclosures) {
                jobRunStatsMap.stat("/convert_report_to_text/attempt").increment();

                // Get the existing disclosure report
                const existingDisclosure = await this.prisma.client.financialDisclosureReport.findUnique({
                    where: {
                        documentId: `${disclosure.DocID}`
                    }
                });

                // Check if the pdf disclosure has already been saved or already been comitted to the database
                if (existingDisclosure) {
                    this.logger.info(`Disclosure already exists in database: ${disclosure.DocID}`);
                    jobRunStatsMap.stat("/convert_report_to_text/skipped").increment();
                    continue;
                }

                // Download the periodic transaction report pdf
                await this.houseGovScraper.downloadPeriodicTransactionReportPdf(disclosure);
                // Wait a bit after downloading to avoid rate-limit
                await new Promise((resolve) => setTimeout(resolve, 2.5*1000));
                try {
                    const disclosurePdfPath = `${pdfDir}/${disclosure.DocID}.pdf`;
                    this.logger.info(`Reading full disclosure report pdf: ${disclosurePdfPath}`);
                    // Read the full disclosure report pdf and save it as a text file
                    const text = await this.disclosureReportReader.readFullDisclosureReportPdfV2(disclosurePdfPath);
                    await this.disclosureReportReader.saveFullDisclosureReportTextFile(text, disclosure);
                    jobRunStatsMap.stat("/convert_report_to_text/success").increment();
                } catch (err) {
                    const e = err as Error;
                    if (e.message !== "Invalid PDF structure.") {
                        throw err;
                    }
                    jobRunStatsMap.stat("/convert_report_to_text/failure").increment();
                    this.logger.error(`Error reading full disclosure report pdf: ${disclosure.DocID}.pdf`);
                    this.logger.error(e.message);
                }
            }
            
        } catch (err) {
            this.logger.error(`Error running task: ${this.constructor.name}`);
            this.logger.error(err);
            await new Promise((resolve) => setTimeout(resolve, 5*1000));
        }

        return jobRunStatsMap;
    }
}
