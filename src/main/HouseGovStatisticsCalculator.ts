import LoggerFactory, {Logger} from "./LoggerFactory";
import PrismaClient from "./PrismaClient";

export default class HouseGovStatisticsCalculator {
    private logger: Logger;
    private prismaClient: PrismaClient;

    constructor(loggerFactory: LoggerFactory, prismaClient: PrismaClient) {
        this.logger = loggerFactory.createPrivateClassLogger(this.constructor.name);
        this.prismaClient = prismaClient;
    }

    /**
     * calculateTransactionVolumes
     * ---------------------------
     * Return a map of assets to the number of occurrences in transactions from the given period. I.E, a histogram.
     * */
    public async calculateTransactionVolumes(startDate: Date, endDate: Date){
        try {
            const transactions = await this.prismaClient.client.transaction.groupBy({
                by: ['asset'], // Group by the 'asset' field
                where: {
                    date: {
                        gte: startDate.toISOString(), // greater than or equal to start date
                        lte: endDate.toISOString(), // less than or equal to end date
                    }
                },
                _count: {
                    asset: true, // Count occurrences of each asset
                },
            });

            // Format the results as a map
            const result = transactions.reduce((acc: Record<string, number>, transaction) => {
                acc[transaction.asset] = transaction._count.asset;
                return acc;
            }, {});

            this.logger.debug(result);

            return result;
        } catch (error) {
            this.logger.error(error);
        }
    }
}