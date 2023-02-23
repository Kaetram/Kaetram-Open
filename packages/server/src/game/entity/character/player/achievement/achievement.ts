import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';

import type { Modules } from '@kaetram/common/network';
import type { AchievementData, RawAchievement } from '@kaetram/common/types/achievement';
import type { PopupData } from '@kaetram/common/types/popup';
import type NPC from '../../../npc/npc';
import type Mob from '../../mob/mob';
import type Player from '../player';

/**
 * An achievement is a simpler version of the quest system. Think
 * of it as a quest with one stage consisting of repetitive actions,
 * that is, kill a mob x amount of times, find x amount of an item.
 * A player is generally rewarded with an item or some experience.
 */

type FinishCallback = (
    skill: Modules.Skills,
    experience?: number,
    item?: string,
    itemCount?: number,
    ability?: string,
    abilityLevel?: number
) => void;
type ProgressCallback = (key: string, stage: number, name: string, description: string) => void;
type PopupCallback = (popup: PopupData) => void;
type TalkCallback = (npc: NPC, player: Player) => void;
type KillCallback = (mob: Mob) => void;

export default class Achievement {
    public name = '';
    private description = '';
    private hidden = false;
    public secret = false;
    private stage = 0; // Current stage of the achievement.
    private stageCount = 0; // How long the achievement is.
    private npc = '';
    private dialogueHidden: string[] = []; // Before achievement is started.
    private dialogueStarted: string[] = []; // After achievement is started.
    private mob: string | string[] = '';
    private item = ''; // Item required for completion
    private itemCount = 1; // How much of the item for completion.
    private rewardItem = '';
    private rewardItemCount = 1;
    private rewardSkill = -1;
    private rewardExperience = 0;
    private rewardAbility = '';
    private rewardAbilityLevel = 1;

    private finishCallback?: FinishCallback;
    private progressCallback?: ProgressCallback;
    private popupCallback?: PopupCallback;

    public talkCallback?: TalkCallback;
    public killCallback?: KillCallback;

    public constructor(private key: string, rawData: RawAchievement) {
        // Load all the data from the raw information.
        this.name = rawData.name;
        this.description = rawData.description || '';
        this.hidden = !!rawData.hidden;
        this.secret = !!rawData.secret;
        this.npc = rawData.npc || '';
        this.dialogueHidden = rawData.dialogueHidden || [];
        this.dialogueStarted = rawData.dialogueStarted || [];
        this.mob = rawData.mob || '';
        // Stage count is how many mobs we must kill or a single stage (e.g. discover door).
        this.stageCount = rawData.mobCount ? rawData.mobCount + 1 : 1; // Increment by 1 to include discovery stage.
        this.item = rawData.item || '';
        this.itemCount = rawData.itemCount || 1;
        this.rewardItem = rawData.rewardItem || '';
        this.rewardItemCount = rawData.rewardItemCount || 1;
        this.rewardSkill = Utils.getSkill(rawData.rewardSkill!);
        this.rewardExperience = rawData.rewardExperience || 0;
        this.rewardAbility = rawData.rewardAbility || '';
        this.rewardAbilityLevel = rawData.rewardAbilityLevel || 1;

        // Callbacks for the achievement.
        this.onTalk(this.handleTalk.bind(this));
        this.onKill(this.handleKill.bind(this));
    }

    /**
     * Handler for when a player interacts with an NPC. The dialogue
     * is handled on a per-achievement basis.
     * @param npc The NPC that we are interacting with.
     * @param player The player that is interacting with the NPC, used
     * to send packets.
     */

    private handleTalk(npc: NPC, player: Player): void {
        log.debug(`[${this.name}] Player ${player.username} talked to ${npc.key}`);

        // This theoretically shouldn't happen but it can't hurt to be careful.
        if (npc.key !== this.npc) return;

        let dialogue = this.isStarted() ? this.dialogueStarted : this.dialogueHidden;

        // End of dialogue, check if the achievement requires an item.
        if (dialogue.length === player.talkIndex)
            if (this.hasItemRequirement()) this.handleItemRequirement(player);
            else this.progress();

        npc.talk(player, dialogue);
    }

    /**
     * Handles when a mob associated with this achievement is killed.
     * @param mob The mob that has been killed.
     */

    private handleKill(mob: Mob): void {
        log.debug(`[${this.name}] Player killed ${mob.key}`);

        // Increment by one for each mob that is killed.
        this.progress();

        log.debug(`Stage: ${this.stage}`);
    }

    /**
     * Handles the removal of an item from the player's inventory
     * for an achievement that requires the player to find an item.
     * @param player The player we are checking the inventory of.
     */

    private handleItemRequirement(player: Player): void {
        let index = player.inventory.getIndex(this.item, this.itemCount);

        // No item found.
        if (index === -1) return;

        player.inventory.remove(index, this.itemCount);

        // Progress after removing the item.
        this.progress();
    }

    /**
     * Advances the current stage by one increment.
     */

    public progress(): void {
        this.setStage(this.stage + 1);
    }

    /**
     * Called when we want to finish the achievement.
     */

    public finish(): void {
        if (this.isFinished()) return;

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

        // Don't send callbacks when loading from database.
        if (loading) return;

        // Handle quest progress callback after updating stage to grab latest name.
        if (isProgress)
            this.progressCallback?.(this.key, stage, this.getName(), this.getDescription());

        /**
         * We use an else-if to ensure that if the achievement is discovered and finished at the
         * same time, the finish popup will be sent. If the achievement has more than one stage
         * we first send the discover popup.
         */

        if (this.stage >= this.stageCount) {
            // Achievement is finished!
            this.popupCallback?.(this.getFinishPopup());
            this.finishCallback?.(
                this.rewardSkill,
                this.rewardExperience,
                this.rewardItem,
                this.rewardItemCount,
                this.rewardAbility,
                this.rewardAbilityLevel
            );
        } else if (this.stage === 1) this.popupCallback?.(this.getDiscoveredPopup());
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
     * Checks whether or not the NPC is associated with this achievement.
     * @param npc The NPC we are checking the key of.
     * @returns Whether or not the NPC key matches the achievement's NPC key.
     */

    public hasNPC(npc: NPC): boolean {
        return npc.key === this.npc;
    }

    /**
     * Checks if the mob provided is within the requirements of the achievement.
     * An achievement may have a singular mob target, or an array of mobs that
     * can be killed to progress.
     * @param mob The mob we are checking in the achievement.
     * @returns Whether or not the mob exists in the achievement.
     */

    public hasMob(mob: Mob): boolean {
        return Array.isArray(this.mob) ? this.mob.includes(mob.key) : mob.key === this.mob;
    }

    /**
     * @returns Whether or not the achievement has an item that is required.
     */

    private hasItemRequirement(): boolean {
        return this.item !== '';
    }

    /**
     * Certain achievements are hidden by default and require more exploration to be
     * discovered by players. Their name will display question marks until discovered.
     * @returns A string that will be used for the achievement name.
     */

    private getName(): string {
        return this.hidden && !this.isStarted() ? '????????' : this.name;
    }

    /**
     * Grabs the description for the achievement. If the achievemnet is hidden and not yet started,
     * question marks will be displayed instead of the actual description.
     * @returns String containing the achievement description.
     */

    private getDescription(): string {
        return this.hidden && !this.isStarted() ? '????????' : this.description;
    }

    /**
     * Returns a popup for when the player has discovered the achievement.
     * @returns Popup data for when the player has discovered the achievement.
     */

    private getDiscoveredPopup(): PopupData {
        return {
            title: 'Achievement Discovered',
            text: `${this.name} has been discovered!`,
            colour: '#33cc33'
        };
    }

    /**
     * Generates a standardized popup for when an achievement is finished depending on
     * what the achievement rewards are.
     * @returns A popup data object containing the completed message.
     */

    private getFinishPopup(): PopupData {
        let text = `@green@You have completed the achievement @crimson@${this.getName()}@green@!`;

        if (this.rewardExperience > 0)
            text = `@green@ You have received @crimson@${this.rewardExperience} experience@green@.`;
        else if (this.rewardAbility)
            text =
                this.rewardAbilityLevel === 1
                    ? `@green@ You have unlocked the @crimson@${this.rewardAbility}@green@ ability.`
                    : `@green@ Your @crimson@${this.rewardAbility} ability is now level ${this.rewardAbilityLevel}@green@.`;
        else if (this.secret)
            text = `@green@You have completed the secret achievement @crimson@${this.getName()}@green@!`;

        return {
            title: 'Achievement Completed!',
            text,
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
            data.description = this.getDescription();
            data.stageCount = this.stageCount;

            // Only send secret achievement information if the achievemnet is secret.
            if (this.secret) data.secret = this.secret;
        }

        return data;
    }

    /**
     * Callback for when the achievement is finished.
     * @param callback Contains the reward information.
     */

    public onFinish(callback: FinishCallback): void {
        this.finishCallback = callback;
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

    /**
     * Callback when an NPC that belongs to the achievement is talked to.
     * @param callback Contains NPC and player object.
     */

    private onTalk(callback: TalkCallback): void {
        this.talkCallback = callback;
    }

    /**
     * Callback for when a player kills a mob that is associated with the achievement.
     * @param callback Contains the mob that was just killed.
     */

    private onKill(callback: KillCallback): void {
        this.killCallback = callback;
    }
}
