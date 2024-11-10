import "reflect-metadata";
import {container} from "tsyringe";
import BraveWebSearchApiClient from "../../main/webscraping/BraveWebSearchApiClient";
import {describe, it, beforeAll, expect} from "vitest";
import LoggerFactory from "../../main/LoggerFactory";

let braveWebSearchApiClient: BraveWebSearchApiClient;

beforeAll(async () => {
   const loggerFactory = container.resolve(LoggerFactory);
   braveWebSearchApiClient = new BraveWebSearchApiClient(loggerFactory);
});

describe("The BraveWebSearchApiClient class", () => {

    it("Should be able to perform web search", async () => {
       const searchResults = await braveWebSearchApiClient.fetchSearchResults("Where is the best hotdog in Redwood City?");
       console.log(JSON.stringify(searchResults.web.results));
       expect(searchResults).toBeDefined();
    });

})