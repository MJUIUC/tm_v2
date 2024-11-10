import "reflect-metadata";
import {container} from "tsyringe";
import PDFExtractor from "../main/PDFExtractor";
import {describe, it, beforeAll, expect} from "vitest";
import LoggerFactory from "../main/LoggerFactory";
import FileHandler from "../main/FileHandler";
import path from "path";

let pdfExtractor: PDFExtractor;

beforeAll(() => {
    const loggerFactory = container.resolve(LoggerFactory);
    const fileHandler = new FileHandler(loggerFactory);
    pdfExtractor = new PDFExtractor(loggerFactory, fileHandler);
});

describe("The PDFExractor", () => {

    it("correctly extracts a text blob from a pdf file", async () => {
        const pdfPath = path.resolve(__dirname, "test_fd_report.pdf");
        const pdfText = await pdfExtractor.getTextBlobFromPdf(pdfPath);

        expect(pdfText).toBeDefined();
    });
});