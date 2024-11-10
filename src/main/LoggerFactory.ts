import pino, { Logger as PinoLogger } from 'pino';
import { singleton } from 'tsyringe';

export type Logger = PinoLogger;

@singleton()
export default class LoggerFactory {
    
    private logger: pino.Logger;

    constructor(){
        this.logger = pino({
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    // ignore: 'pid,hostname'
                }
            }
        });
    }

    public createPrivateClassLogger(className: string): pino.Logger {
        return this.logger.child({ className });
    }
}
