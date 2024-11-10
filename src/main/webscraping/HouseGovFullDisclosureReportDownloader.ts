import path from 'path';
import {z} from 'zod';
import {injectable, singleton} from "tsyringe";
import {XMLParser} from 'fast-xml-parser';
import LoggerFactory, {Logger} from '../LoggerFactory';
import FileHandler from '../FileHandler';

const HouseGovFinancialDisclosureSchema = z.object({
    Prefix: z.string().optional(),
    Last: z.string(),
    First: z.string(),
    Suffix: z.string().optional(),
    FilingType: z.string(),
    StateDst: z.string(),
    Year: z.string(),
    FilingDate: z.string(),
    DocID: z.string(),
});

/**
 * HouseGovFinancialDisclosure
 * ---------------------------
 * An object representing a financial disclosure made by a member of the House of Representatives. Data is extracted
 * from the xml file contained in the full disclosure report zip file. This interface contains a function which reads a
 * FDR XML file and returns an array of these objects.
*/
export type HouseGovFinancialDisclosure = z.infer<typeof HouseGovFinancialDisclosureSchema>;

@singleton()
@injectable()
export default class HouseGovFullDisclosureReportDownloader {
    private logger: Logger;

    private xmlParser: XMLParser;
    private fileHandler: FileHandler;

    constructor(logger: LoggerFactory, fileHandler: FileHandler) {
        this.logger = logger.createPrivateClassLogger(this.constructor.name);
        this.fileHandler = fileHandler;
        this.xmlParser = new XMLParser();
    }

    /**
     * downloadFullDisclosureReportZip
     * ----------------------------
     * Downloads and extracts the full year disclosure report for the House of Representatives.
     * The reports is a zip file containing a text that looks like a CSV file and an xml file of the
     * same data.
     * @param year - The year of the report to download.
     * @param downloadDir - The directory to save the downloaded file.
    */
    public downloadFullDisclosureReportZip(year: string, downloadDir: string) {
        this.logger.info(`Downloading full disclosure report for year ${year}`);

        const protocol = 'https:';
        const host = 'disclosures-clerk.house.gov';
        const path = `/public_disc/financial-pdfs/${year}FD.zip`;

        return this.fileHandler.downloadFile({ protocol, host, path }, downloadDir)
    }

    /**
     * unzipAndParseFullDisclosureReportZip
     * ------------------------------------
     * Unzips and parses the FD (full disclosure report). The FD report is an xml file containing
     * each member's financial disclosure made in the year. This function returns an itterable array
     * of HouseGovFinancialDisclosure objects that come from the xml file.
     * 
     * @param year - The year of the reports to download.
     * @param filePath - The path to the zip file.
     * @returns An array of HouseGovFinancialDisclosure objects.
    */
    public async unzipAndParseFullDisclosureReportZip(year: string, filePath: string): Promise<HouseGovFinancialDisclosure[]>  {
        this.logger.info(`Unzipping and parsing full disclosure report at ${filePath}`);

        const unpackedDir = `./temp/${year}`;

        await this.fileHandler.recursiveMkdir(unpackedDir);

        await this.fileHandler.extractZipToDir(filePath, unpackedDir);

        const xmlFDReportBuffer = await this.fileHandler.readFileToBuffer(`${unpackedDir}/${year}FD.xml`);
        
        return this.xmlParser.parse(xmlFDReportBuffer.toString()).FinancialDisclosure.Member as HouseGovFinancialDisclosure[];
    }

    /**
     * downloadPeriodicTransactionReportPdf
     * ------------------------------------
     * Downloads the periodic transaction report for a given reported disclosure.
     * @param disclosureData - The disclosure data.
     * @returns The path the downloaded disclosure report pdf.
     * 
    */
    public async downloadPeriodicTransactionReportPdf(disclosureData: HouseGovFinancialDisclosure): Promise<string> {
        this.logger.info(`Downloading periodic transaction report for ${disclosureData.First} ${disclosureData.Last}`);

        const protocol = 'https:';
        const host = 'disclosures-clerk.house.gov';
        const urlPath = `/public_disc/ptr-pdfs/${disclosureData.Year}/${disclosureData.DocID}.pdf`;

        const pdfDir = path.resolve(__dirname, "..", "..", "downloads", `${disclosureData.Year}`, "pdf");

        await this.fileHandler.recursiveMkdir(pdfDir);
        return await this.fileHandler.downloadFile({ protocol, host, path: urlPath }, pdfDir);
    }
}