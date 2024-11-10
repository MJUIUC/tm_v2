import {injectable, singleton} from "tsyringe"
import LoggerFactory, { Logger } from "../LoggerFactory";
import {Axios} from "axios";
import {WebSearchResults, WebSearchResultSchema} from "./BraveAPISchemas";

const API_KEY = "BSAOWSAQGaiY9VsqZeYDR9p5TU5Qwbx";

@singleton()
@injectable()
export default class BraveWebSearchApiClient {
    private logger: Logger;
    private axiosSearchInstance: Axios;

    constructor(loggerFactory: LoggerFactory) {
        this.logger = loggerFactory.createPrivateClassLogger(this.constructor.name);

        this.axiosSearchInstance = new Axios({
            baseURL: "https://api.search.brave.com/res/v1/web/search",
            headers: {
                "Accept": "application/json",
                "Accept-Encoding": "gzip",
                "X-Subscription-Token": API_KEY,
            }
        });
    }

    public async fetchSearchResults(query: string): Promise<WebSearchResults> {
        try {
            const { data } = await this.axiosSearchInstance.get(``, {
                params: {
                    q: query,
                    count: 10
                }
            });
            return WebSearchResultSchema.parse(JSON.parse(data));
        } catch (e) {
            this.logger.error(e);
            throw new Error("Problem fetching search results");
        }
    }
}
