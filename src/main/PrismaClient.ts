import prisma from '@prisma/client';
import LoggerFactory, {Logger} from './LoggerFactory';
import { injectable, singleton } from "tsyringe";

@singleton()
@injectable()
export default class PrismaClient {
    public client: prisma.PrismaClient;
    private logger: Logger;

    constructor(logger: LoggerFactory) {
        this.logger = logger.createPrivateClassLogger(this.constructor.name);
        this.client = new prisma.PrismaClient();
    }

    public async getPoliticianByName(first: string, last: string) {
        return this.client.politician.findFirst({
            where: {
                firstName: first,
                lastName: last
            }
        });
    }

    public async getDisclosureByDocumentId(documentId: string) {
        return this.client.financialDisclosureReport.findFirst({
            where: {
                documentId: documentId
            }
        });
    }
}