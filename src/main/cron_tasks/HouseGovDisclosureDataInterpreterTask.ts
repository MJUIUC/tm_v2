import { injectable, singleton } from "tsyringe";
import fs from "fs";
import pino from "pino";
import path from "path";
import { v4 as uuidv4 } from 'uuid';
import LoggerFactory from "../LoggerFactory";
import PrismaClient from "../PrismaClient";
import FileHandler from "../FileHandler";
import HouseGovFullDisclosureReportDownloader from "../webscraping/HouseGovFullDisclosureReportDownloader";
import { HouseGovFinancialDisclosure } from "../webscraping/HouseGovFullDisclosureReportDownloader";
import TaskBase from "./TaskBase";
import OpenAIClient from "../llm_clients/OpenAIClient";
import TaskRunStatsCollector from "./TaskRunStatsCollector";
import {
    PeriodicTransactionReport, Transaction
} from "../llm_clients/TransactionReportStructuredResponse";

/**
 * HouseGovDisclosureDataInterpreterTask
 * ------------------------------------
 * A job that interprets the data from the HouseGovDisclosureDownloadJob and saves it to a database. The downloads
 * job saves the downloaded pdf files, transpiles them to text, and saves them as text files in a directory. This job
 * reads those text files, interprets the data with openAI, then saves it to a database.
*/
@singleton()
@injectable()
export default class HouseGovDisclosureDataInterpreterTask extends TaskBase {
    private prisma: PrismaClient;
    private logger: pino.Logger<never>;
    private fileHandler: FileHandler;
    private houseGovScraper: HouseGovFullDisclosureReportDownloader;
    private openAIClient: OpenAIClient;

    private startTime: number = 0;
    
    constructor (
        prisma: PrismaClient,
        logger: LoggerFactory,
        fileHandler: FileHandler,
        houseGovScraper: HouseGovFullDisclosureReportDownloader,
        openAIClient: OpenAIClient ) 
    {
        super();
        this.logger = logger.createPrivateClassLogger(this.constructor.name);
        this.prisma = prisma;
        this.fileHandler = fileHandler
        this.houseGovScraper = houseGovScraper;
        this.openAIClient = openAIClient
    }

    private async saveErrorLog(disclosure: HouseGovFinancialDisclosure, error: string) {
        // Define the log file path
        const errorLogFilePath = path.join(__dirname, `${this.constructor.name}-${this.startTime}.err.log`);
        
        // Format the error with a timestamp
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${error}\n`;
    
        // Append the error to the log file
        await fs.promises.appendFile(errorLogFilePath, logMessage, { encoding: 'utf8' });
    }

    private async checkAndSavePoliticianFromDisclosure(disclosure: HouseGovFinancialDisclosure){
        let politician = await this.prisma.getPoliticianByName(disclosure.First, disclosure.Last);

        if (politician == null) {
            this.logger.info(`Creating new politician: ${disclosure.First} ${disclosure.Last}`);
            politician = await this.prisma.client.politician.create({
                data: {
                    firstName: disclosure.First,
                    lastName: disclosure.Last,
                    fullTitle: `${disclosure.Prefix} ${disclosure.First} ${disclosure.Last} ${disclosure.Suffix}`.trim(),
                    uuid: uuidv4()
                }
            });
        }

        return politician;
    }

    private async getDisclosureTextFileAsBuffer(docId: string, year: string){
        // Read the full disclosure report text file
        const disclosureTextFilePath = path.join(__dirname, "..", "..", "downloads", `${year}`, "text", `${docId}.txt`);
        return await this.fileHandler.readFileToBuffer(disclosureTextFilePath);
    }

    private async saveDisclosureReport(
        politicianUuid: string,
        financialDisclosuresDocument: HouseGovFinancialDisclosure
    ){
        this.logger.info(`Creating new financial disclosure report: ${financialDisclosuresDocument.DocID}`);
        return this.prisma.client.financialDisclosureReport.create({
            data: {
                uuid: uuidv4(),
                politicianUuid,
                year          : Number(financialDisclosuresDocument.Year),
                filingDate    : financialDisclosuresDocument.FilingDate,
                filingType    : financialDisclosuresDocument.FilingType,
                documentId    : String(financialDisclosuresDocument.DocID),
                reportUrl     : `https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/${financialDisclosuresDocument.Year}/${financialDisclosuresDocument.DocID}.pdf`,
            }
        });
    }

    private async saveDisclosureReportTransactions (
        politicianUuid: string,
        financialDisclosureReportUuid: string,
        transactions: Transaction[]
    ){
        for (const transaction of transactions) {
            await this.prisma.client.transaction.create({
                data: {
                    uuid: uuidv4(),
                    politicianUuid,
                    date: transaction.date,
                    notification_date: transaction.notification_date,
                    type: transaction.type,
                    amount: transaction.amount,
                    owner: transaction.owner,
                    capital_gains: transaction.capital_gains,
                    details: transaction.details,
                    asset: transaction.asset,
                    financialDisclosureReportUuid,
                }
            });
        }
    }
    
    public async execute() {
        this.startTime = new Date().getTime();
        const currentYear = new Date().getFullYear().toString();
        const pathToZip = path.join(__dirname, "..", "..", "downloads", `${currentYear}FD.zip`);

        const jobRunStatsMap = new TaskRunStatsCollector(`${this.constructor.name}Stats`);
        
        const FinancialDisclosuresDocuments: HouseGovFinancialDisclosure[] = await this.houseGovScraper
            .unzipAndParseFullDisclosureReportZip(currentYear, pathToZip);

        for (const financialDisclosuresDocument of FinancialDisclosuresDocuments) {
            this.logger.info(`Processing report: ${financialDisclosuresDocument.DocID}`);
            
            jobRunStatsMap.stat("/interpret_report/attempts").increment();

            const politician = await this.checkAndSavePoliticianFromDisclosure(financialDisclosuresDocument);

            let disclosureTextBuffer: Buffer;
            try {
                disclosureTextBuffer = await this
                    .getDisclosureTextFileAsBuffer(financialDisclosuresDocument.DocID, currentYear);
            } catch (err) {
                this.logger.error(`Text file not found for report: ${financialDisclosuresDocument.DocID}`);
                jobRunStatsMap.stat("/interpret_report/failed/no-text-file-for-report").increment();
                continue;
            }

            let financialDisclosureReport = await this.prisma.getDisclosureByDocumentId(`${financialDisclosuresDocument.DocID}`);
            if (financialDisclosureReport == null) {
                financialDisclosureReport = await this.saveDisclosureReport(politician.uuid, financialDisclosuresDocument);
            } else {
                // If report already exists, no need to process transactions again.
                this.logger.info(`Report already exists: ${financialDisclosuresDocument.DocID}`);
                jobRunStatsMap.stat("/interpret_report/skipped").increment();
                continue;
            }

            let openAIResponseJson: PeriodicTransactionReport;

            try {
                // Interpret the data with openAI
                openAIResponseJson = await this.openAIClient
                    .periodicTransactionReportCompletionV2(disclosureTextBuffer.toString('utf-8'));
            } catch (err) {
                const error = err as Error;
                this.logger.error(`Error parsing openAI response for report: ${financialDisclosuresDocument.DocID}`);
                await this.saveErrorLog(financialDisclosuresDocument, error.message);
                jobRunStatsMap.stat("/interpret_report/failed/openai-response-parsing-error").increment();
                continue;
            }

            try {
                // Save each transaction to the database
                await this.saveDisclosureReportTransactions(
                        politician.uuid,
                        financialDisclosureReport.uuid,
                        openAIResponseJson.transactions);
            } catch (err) {
                const error = err as Error;
                this.logger.error(`Error saving transactions for report: ${financialDisclosuresDocument.DocID}`);
                await this.saveErrorLog(financialDisclosuresDocument, error.message);
                jobRunStatsMap.stat("/interpret_report/failed/transaction-save-error").increment();
                continue;
            }

            // wait for a bit to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2500));
            jobRunStatsMap.stat("/interpret_report/success").increment();
        }

        return jobRunStatsMap;
    }
}