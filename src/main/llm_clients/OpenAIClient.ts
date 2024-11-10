import OpenAI from "openai";
import {zodResponseFormat} from "openai/helpers/zod";
import LoggerFactory, {Logger} from "../LoggerFactory";
import {injectable, singleton} from "tsyringe";
import {PeriodicTransactionReport, PeriodicTransactionReportSchema} from "./TransactionReportStructuredResponse";
import BraveWebSearchApiClient from "../webscraping/BraveWebSearchApiClient";

interface OpenAIChatMessage {
    role: string;
    message: string;
}

@singleton()
@injectable()
export default class OpenAIClient {
    private client: OpenAI;
    private braveApiClient: BraveWebSearchApiClient;
    private logger: Logger;

    constructor(logger: LoggerFactory, braveApiClient: BraveWebSearchApiClient) {
        this.client = new OpenAI({

        });

        this.braveApiClient = braveApiClient;

        this.logger = logger.createPrivateClassLogger(this.constructor.name);
    }

    async periodicTransactionReportCompletionV2(transactionReportText: string): Promise<PeriodicTransactionReport> {
        const completion = await this.client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: `Convert the periodic transaction report details into a json structure.`},
                { role: "user", content: transactionReportText}
            ],
            response_format: zodResponseFormat(PeriodicTransactionReportSchema, "periodicTransactionReport")
        });

        try {
            const completionResponseObject = JSON.parse(completion.choices[0].message.content as string);

            return PeriodicTransactionReportSchema.parse(completionResponseObject);
        } catch (e) {
            this.logger.error(e);
            throw new Error("Trouble parsing the model response");
        }
    }
}
