import {injectable, singleton} from "tsyringe";
import {PDFExtract} from 'pdf.js-extract';
import FileHandler from "./FileHandler";
import LoggerFactory, {Logger} from "./LoggerFactory";

@singleton()
@injectable()
export default class PDFExtractor {
    private logger: Logger;
    private fileHandler: FileHandler;
    private pdfExtract: PDFExtract

    constructor(loggerFactory: LoggerFactory, fileHandler: FileHandler) {
        this.logger = loggerFactory.createPrivateClassLogger(this.constructor.name);
        this.fileHandler = fileHandler;

        this.pdfExtract = new PDFExtract();
    }

    public async getTextBlobFromPdf(filePath: string) {
        const pdfBuffer = await this.fileHandler.readFileToBuffer(filePath);
        const pdfExtractResult = await this.pdfExtract.extractBuffer(pdfBuffer);

        let pdfTextBlob = "";
        pdfExtractResult.pages.forEach(page => {
            pdfTextBlob += page.content.map(c => c.str).join(' ');
        });

        return pdfTextBlob.replace(/\x00/g, ' ').trim();
    }
}