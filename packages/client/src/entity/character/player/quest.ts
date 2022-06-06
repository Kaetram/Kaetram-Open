export default class Quest {
    public constructor(
        public name: string,
        public description: string,
        public stage: number,
        public subStage: number,
        public stageCount: number
    ) {}

    /**
     * Updates the stage and sub stage data for the quest.
     * @param stage New stage we are setting the quest to.
     * @param subStage New subStage we are setting the quest to.
     */

    public update(stage: number, subStage: number): void {
        this.stage = stage;
        this.subStage = subStage;
    }

    /**
     * A quest is deemed complete when the current stage
     * we are on is equal or larger to total amount of stages.
     * @returns If stage is equal or larger to total amount of stages.
     */

    public isFinished(): boolean {
        return this.stage >= this.stageCount;
    }

    /**
     * @returns Whether the quest's stage is above 0, meaning quest
     * has been started.
     */

    public isStarted(): boolean {
        return this.stage > 0;
    }
}
