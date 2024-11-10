import Alpaca from "@alpacahq/alpaca-trade-api";
import LoggerFactory, {Logger} from "../LoggerFactory";
import {injectable, singleton} from "tsyringe";

const DEFAULT_FEED = "iex";

class AlpacaTradingClientError extends Error {
    constructor(message: string) {
        super();
        this.message = message;
    }
}

@singleton()
@injectable()
export default class AlpacaTradingClient {
    private logger: Logger;
    private alpacaMarketApiClient: Alpaca;

    constructor(loggerFactory: LoggerFactory) {
        this.logger = loggerFactory.createPrivateClassLogger(this.constructor.name);
        this.alpacaMarketApiClient = new Alpaca({
            keyId: "AKXSGWJQELOFK82I376G",
            secretKey: "sXAhNmeOgG2xf4AFwrKBn46fiORa5yPJKqomqQYP",
        });
    }

    public async getLatestBar(symbol: string){
        try {

        } catch (e) {
            this.logger.error(e);
            throw new AlpacaTradingClientError("An error occurred while calling the Latest bars api.");
        }
    }
}