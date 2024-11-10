import path from "path";
import LoggerFactory, {Logger} from "../LoggerFactory";
import FileHandler from "../FileHandler";
import {injectable, singleton} from "tsyringe";
import {HouseGovFinancialDisclosure} from "./HouseGovFullDisclosureReportDownloader";
import PDFExtractor from "../PDFExtractor";

export interface Transaction {
    assetName: string;
    type: string;
    notificationDate: string;
    transactionDate: string;
    amount: string;
    status: string;
    transactionType: string; // New field for transaction type
    owner?: string; // Optional field for owner
}

export interface FinancialReport {
    name: string;
    status: string;
    stateDistrict: string;
    filingID: string;
    transactions: Transaction[];
}

@singleton()
@injectable()
export default class HouseGovFullDisclosureReportReader {
    private logger: Logger;
    private fileHandler: FileHandler;
    private pdfExtractor: PDFExtractor;

    constructor(logger: LoggerFactory, fileHandler: FileHandler, pdfExtractor: PDFExtractor) {
        this.logger = logger.createPrivateClassLogger(this.constructor.name);
        this.fileHandler = fileHandler;
        this.pdfExtractor = pdfExtractor;
    }

    public async readFullDisclosureReportPdfV2(pdfPath: string) {
        return await this.pdfExtractor.getTextBlobFromPdf(pdfPath);
    }

    public async saveFullDisclosureReportTextFile(text: string, disclosure: HouseGovFinancialDisclosure): Promise<void> {
        const fileDir = path.resolve(__dirname, "..", "..", "downloads", `${disclosure.Year}`, "text");
        const filePath = path.resolve(fileDir, `${disclosure.DocID}.txt`);

        this.logger.info(`Saving text to ${filePath}`);
        await this.fileHandler.recursiveMkdir(fileDir);
        await this.fileHandler.writeFileFromBuffer(filePath, Buffer.from(text.trim(), 'utf-8'));
    }

    public async saveFullDisclosureReportJsonFile(json: string, disclosure: HouseGovFinancialDisclosure): Promise<void> {
        const fileDir = path.resolve(__dirname, "..", "..", "downloads", disclosure.Year, "json");
        const filePath = path.resolve(fileDir, `${disclosure.DocID}.json`);
        this.logger.info(`Saving json to ${filePath}`);
        await this.fileHandler.recursiveMkdir(fileDir);
        await this.fileHandler.writeFileFromBuffer(filePath, Buffer.from(json.trim(), 'utf-8'));
    }
    
}