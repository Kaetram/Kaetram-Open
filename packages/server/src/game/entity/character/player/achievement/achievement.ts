import { PopupData } from '@kaetram/common/types/popup';
import { RawAchievement, AchievementData } from '@kaetram/common/types/achievement';

/**
 * An achievement is a simpler version of the quest system. Think
 * of it as a quest with one stage consisting of repetitive actions,
 * that is, kill a mob x amount of times, find x amount of an item.
 * A player is generally rewarded with an item or some experience.
 */

type ProgressCallback = (key: string, stage: number, name: string) => void;
type PopupCallback = (popup: PopupData) => void;

export default class Achievement {
    private name = '';
    private description = '';
    private stage = 0; // Current stage of the achievement.
    private stageCount = 0; // How long the achievement is.

    private progressCallback?: ProgressCallback;
    private popupCallback?: PopupCallback;

    public constructor(private key: string, rawData: RawAchievement) {
        // Stage data is how many mobs we must kill or a single stage (e.g. discover door).
        this.name = rawData.name;
        this.description = rawData.description || '';
        this.stageCount = rawData.mobCount! || 1;
    }

    /**
     * Called when we want to finish the achievement.
     */

    public finish(): void {
        this.setStage(this.stageCount);
    }

    /**
     * Updates the current stage of the achievement and
     * creates the necessary callbacks.
     * @param stage The stage we are updating the achievement to.
     * @param loading Skips callbacks when loading from database.
     */

    public setStage(stage: number, loading = false): void {
        // Is the new stage different from current stage?
        let isProgress = this.stage !== stage;

        this.stage = stage;

        // Handle quest progress callback after updating stage to grab latest name.
        if (isProgress) this.progressCallback?.(this.key, stage, this.getName());

        if (loading) return;

        /**
         * We use an else-if to ensure that if the achievement is discovered and finished at the
         * same time, the finish popup will be sent. If the achievement has more than one stage
         * we first send the discover popup.
         */

        if (this.stage === this.stageCount) this.popupCallback?.(this.getFinishPopup());
        else if (this.stage === 1) this.popupCallback?.(this.getDiscoveredPopup());
    }

    /**
     * @returns Whether or not the stage is greater than 0.
     */

    public isStarted(): boolean {
        return this.stage > 0;
    }

    /**
     * An achievement is complete when the stage is equal or greater
     * to the stage count.
     * @returns Whether the stage is greater or equal to the stage count.
     */

    public isFinished(): boolean {
        return this.stage >= this.stageCount;
    }

    /**
     * The achievement's name is hidden until it is discovered, that is,
     * until the stage does not equal 0.
     * @returns Actual name of the achievement or ???????? if it is not discovered.
     */

    private getName(): string {
        return this.isStarted() ? this.name : '????????';
    }

    private getDiscoveredPopup(): PopupData {
        return {
            title: 'Achievement Discovered',
            text: `${this.name} has been discovered!`,
            colour: '#33cc33'
        };
    }

    /**
     * Generates a standardized popup for when an achievement is finished.
     * @returns A popup data object containing the completed message.
     */

    private getFinishPopup(): PopupData {
        return {
            title: 'Achievement Completed!',
            text: `@green@You have completed the achievement @crimson@${this.getName()}@green@!`,
            colour: '#33cc33'
        };
    }

    /**
     * Serializes the achievement into barebones information
     * for storing into the database or sending to the client.
     * @param withInfo Whether or not to include additional information.
     * @returns A serialized object containing name, description,
     * stage, etc.
     */

    public serialize(withInfo = false): AchievementData {
        let data: AchievementData = {
            key: this.key,
            stage: this.stage
        };

        if (withInfo) {
            data.name = this.getName();
            data.description = this.description;
            data.stageCount = this.stageCount;
        }

        return data;
    }

    /**
     * Progress callback containing information about the stage.
     * @param callback Contains key and stage of the achievement.
     */

    public onProgress(callback: ProgressCallback): void {
        this.progressCallback = callback;
    }

    /**
     * Callback for when a popup callback occurs.
     * @param callback Contains data about the popup.
     */

    public onPopup(callback: PopupCallback): void {
        this.popupCallback = callback;
    }
}
