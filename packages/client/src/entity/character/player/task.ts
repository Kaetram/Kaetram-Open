/**
 * A task represents a quest or an achievement object. The only difference
 * in serialized client data between those two is that a quest contains
 * a sub stage variable.
 */

export default class Task {
    public secret = false; // Whether or not the task is a secret task.

    public constructor(
        public id: number,
        public name: string,
        public description: string,
        public stage = 1,
        public stageCount = 1,
        public subStage?: number,
        public rewards?: string[]
    ) {}

    /**
     * Updates the stage and sub stage data for the task.
     * @param stage New stage we are setting the task to.
     * @param subStage New subStage we are setting the task to.
     * @param name New name we are setting the task to (used for achievements).
     * @param description New description we are setting the task to (used for hidden achievements).
     */

    public update(stage: number, subStage?: number, name?: string, description?: string): void {
        this.stage = stage;

        if (subStage) this.subStage = subStage;
        if (name) this.name = name; // For achievements when they're discovered.
        if (description) this.description = description; // For hidden achievements.
    }

    /**
     * A task is deemed complete when the current stage
     * we are on is equal or larger to total amount of stages.
     * @returns If stage is equal or larger to total amount of stages.
     */

    public isFinished(): boolean {
        return this.stage >= this.stageCount;
    }

    /**
     * @returns Whether the task's stage is above 0, meaning task
     * has been started.
     */

    public isStarted(): boolean {
        return this.stage > 0;
    }
}
