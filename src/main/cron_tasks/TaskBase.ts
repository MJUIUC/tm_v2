import TaskRunStatsCollector from "./TaskRunStatsCollector";

export default abstract class TaskBase {
    /**
     * Each Task needs to have an execute method that is called by the Job or Scheduler.
    */
    abstract execute(): Promise<TaskRunStatsCollector | void>;
}