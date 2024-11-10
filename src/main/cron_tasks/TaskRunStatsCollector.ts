import { container } from "tsyringe";
import pino from "pino";
import LoggerFactory from "../LoggerFactory";

class TaskRunStatCounter {
    private key: string;
    private value: number;

    constructor(key: string, defaultValue: number = 0) {
        this.key = key;
        this.value = defaultValue;
    }

    public increment() {
        this.value++;
        return this;
    }

    public incrementBy(value: number) {
        this.value += value;
        return this;
    }

    public decrement() {
        this.value--;
        return this;
    }

    public decrementBy(value: number) {
        this.value -= value;
        return this;
    }

    public setValue(value: number) {
        this.value = value;
        return this;
    }

    public generateReport() {
        return {
            key: this.key,
            value: this.value
        };
    }
}

export interface TaskRunStatsCollectorReport {
    statCollectorName: string;
    stats: {
        key: string;
        value: number;
    }[];
}

/**
 * TaskRunStatsCollector
 * ---------------------
 * A simple stat collector class for collecting various statistics during a task execution. Works by
 * maintaining a mapping between a stat key and a counter object.
 * */
export default class TaskRunStatsCollector {
    public statCollectorName: string;
    private logger: pino.Logger<never>;
    private keyToStatMap: Map<string, TaskRunStatCounter>;

    constructor(
      statCollectorName: string
    ) {
        this.statCollectorName = statCollectorName;
        this.logger = container.resolve(LoggerFactory).createPrivateClassLogger(this.constructor.name);
        this.keyToStatMap = new Map<string, TaskRunStatCounter>();
    }

    public stat(key: string) {
        if (this.keyToStatMap.has(key)) {
            return this.keyToStatMap.get(key)!;
        }

        const newStat = new TaskRunStatCounter(key);
        this.keyToStatMap.set(key, newStat);

        return newStat;
    }

    public removeStat(key: string) {
        if (!this.keyToStatMap.has(key)) {
            this.logger.error(`StatKey ${key} does not exist, cannot remove.`);
            return;
        }

        this.keyToStatMap.delete(key);
    }

    public generateReportSummary(): TaskRunStatsCollectorReport {
        const stats = [];

        for (const [key, stat] of this.keyToStatMap.entries()) {
            stats.push(stat.generateReport());
        }
        
        return {
            statCollectorName: this.statCollectorName,
            stats: stats
        }
    }
}