import "reflect-metadata";
import {container} from "tsyringe";
import {describe, it, beforeAll, expect} from "vitest";
import LoggerFactory from "../../main/LoggerFactory";
import HouseGovFullDisclosureReportDownloader from "../../main/webscraping/HouseGovFullDisclosureReportDownloader";
import FileHandler from "../../main/FileHandler";

let houseGovDownloader: HouseGovFullDisclosureReportDownloader;

beforeAll(async () => {
    const loggerFactory = container.resolve(LoggerFactory);
    const fileHandler = container.resolve(FileHandler);
    houseGovDownloader = new HouseGovFullDisclosureReportDownloader(loggerFactory, fileHandler);
});

describe("The HouseGovFullDisclosureReportDownloader", () => {

    it("downloads an un-corrupted pdf file", async () => {

    });
});