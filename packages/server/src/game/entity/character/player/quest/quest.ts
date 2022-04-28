import _ from 'lodash';

import NPC from '../../../npc/npc';
import Mob from '../../mob/mob';
import Player from '../player';

import log from '@kaetram/common/util/log';

import { QuestData, RawQuest, RawStage, StageData } from '@kaetram/common/types/quest';
import { PointerData } from '@kaetram/common/types/pointer';
import { ProcessedDoor } from '@kaetram/common/types/map';
import Item from '../../../objects/item';
import { PopupData } from '@kaetram/common/types/popup';
import Modules from '@kaetram/common/network/modules';

export default abstract class Quest {
    /**
     * An abstract quest class that takes the raw quest data and
     * de-serializes its data into a quest object for later use.
     */

    private name = '';
    private description = '';
    private stage = 0; // How far along in the quest we are.
    private subStage = 0; // Progress in the substage (say we're tasked to kill 20 rats).
    protected stageCount = 0; // How long the quest is.

    private stageData: StageData; // Current stage data, constantly updated when progression occurs.
    private stages: { [id: number]: RawStage } = {}; // All the stages from the JSON data.

    // Store all NPCs involved in the quest.
    private npcs: string[] = [];

    public talkCallback?: (npc: NPC, player: Player) => void;
    public doorCallback?: (quest: ProcessedDoor, player: Player) => void;
    public killCallback?: (mob: Mob) => void;

    private progressCallback?: (key: string, stage: number, stageCount: number) => void;
    private pointerCallback?: (pointerData: PointerData) => void;
    private popupCallback?: (popupData: PopupData) => void;

    public constructor(private key: string, rawData: RawQuest) {
        this.name = rawData.name;
        this.description = rawData.description;
        this.stageCount = Object.keys(rawData.stages).length;

        this.stages = rawData.stages;

        this.stageData = this.getStageData();

        this.loadNPCs();

        // Callbacks
        this.onTalk(this.handleTalk.bind(this));
        this.onDoor(this.handleDoor.bind(this));
        this.onKill(this.handleKill.bind(this));
    }

    /**
     * Blank function for use in subclasses. See `Tutorial.ts`.
     */

    public loaded(): void {
        log.debug(`[${this.key}] Uninitialized loaded();`);
    }

    /**
     * Parses through all the stages and stores the NPCs that the player
     * will engage with. This is necessary in order to prevent the default
     * dialogue from occurring while the quest is in progress.
     */

    private loadNPCs(): void {
        // Iterate through the stages and extract the NPCs
        _.each(this.stages, (stage: RawStage) => {
            if (stage.npc && !this.hasNPC(stage.npc)) this.npcs.push(stage.npc);
        });
    }

    /**
     * Callback handler for when a player talks to an NPC.
     * @param npc The NPC that the player interacted with.
     * @param player The player that interacts with the NPC.
     */

    private handleTalk(npc: NPC, player: Player): void {
        log.debug(`[${this.name}] Talking to NPC: ${npc.key} - stage: ${this.stage}.`);

        // Extract the dialogue for the NPC.
        let dialogue = this.getNPCDialogue(npc);

        /**
         * Ends the conversation. If the player has the required item in the inventory
         * it will check for that first. If the stage requires the player be given an item
         * it must be given before the conversation ends and quest progresses.
         */
        if (this.stageData.npc! === npc.key && dialogue.length === player.talkIndex)
            if (!this.hasItemRequirement())
                if (this.hasItemToGive()) {
                    if (
                        this.givePlayerItem(
                            player,
                            this.stageData.itemKey!,
                            this.stageData.itemCount!
                        )
                    )
                        this.progress();
                } else this.progress();
            else this.handleItemRequirement(player, this.stageData);

        // Talk to the NPC and progress the dialogue.
        npc.talk(player, dialogue);
    }

    /**
     * Callback handler for when a player attemps to pass through a door.
     * @param door The door that the player is trying to enter.
     * @param player The player instance that we send actions to.
     */

    private handleDoor(door: ProcessedDoor, player: Player): void {
        log.debug(`[${this.name}] Door: ${door.x}-${door.y} - stage: ${this.stage}.`);

        if (this.stage < door.stage!) return player.notify('You cannot pass through this door.');

        player.teleport(door.x, door.y, true);

        this.progress();
    }

    /**
     * Handler when killing a mob. Determines
     * whether to progress or not.
     * @param mob The mob we are killing.
     */

    private handleKill(mob: Mob): void {
        log.debug(
            `[${this.name}] Killing mob: ${mob.key}, stage: ${this.stage}, subStage: ${this.subStage}.`
        );

        if (!this.stageData.mob)
            return log.error(`[${this.name}] No mob data for stage: ${this.stage}.`);

        // Substage progression when the mob killed matches the quest's list of mobs.
        if (this.stageData.mob.includes(mob.key)) this.progress(true);

        // Progress to the next stage after we reach the `mobCountRequirement`.
        if (this.subStage >= this.stageData.mobCountRequirement) this.progress();
    }

    /**
     * Advances the quest to the next stage.
     */

    private progress(subStage?: boolean): void {
        log.debug(`${this.name} Quest progression.`);

        // Progress substage only if the parameter is defined.
        if (subStage) this.setStage(this.stage, this.subStage + 1);
        else this.setStage(this.stage + 1);
    }

    /**
     * Checks the player's inventory and progresses if
     * he contains enough of the required item.
     * @param player The player we are checking inventory of.
     */

    private handleItemRequirement(player: Player, stageData: StageData): void {
        // Extract the item key and count requirement.
        let { itemRequirement, itemCountRequirement } = stageData,
            index = player.inventory.getIndex(itemRequirement, itemCountRequirement);

        // Cannot find the item in the inventory (or with correct count).
        if (index === -1) return;

        // Remove `countRequirement` amount of an item at the index.
        player.inventory.remove(index, itemCountRequirement);

        this.progress();
    }

    /**
     * Attemps to add an item into the player's inventory and returns
     * the conditional status of that action.
     * @param player The player we are adding the item to.
     * @param key The item key's identifier.
     * @param count The amount of the item we're adding.
     * @returns Whether or not adding the item was successful.
     */

    private givePlayerItem(player: Player, key: string, count = 1): boolean {
        return player.inventory.add(new Item(key, -1, -1, false, count));
    }

    /**
     * Checks if an NPC key is contained in the quest.
     * @param key The NPC key we are checking.
     * @returns If the key exists in the npcs array.
     */

    public hasNPC(key: string): boolean {
        return this.npcs.includes(key);
    }

    /**
     * Checks if the current stage has an item requirement.
     * @returns If the item requirement property exists in the current stage.
     */

    private hasItemRequirement(): boolean {
        return !!this.stageData.itemRequirement;
    }

    /**
     * Checks if the current stage has an item to give to the player.
     * @returns If the `itemKey` proprety exists in the current stage.
     */

    private hasItemToGive(): boolean {
        return !!this.stageData.itemKey;
    }

    /**
     * A check if the quest is started or it has yet to be discovered.
     * @returns Whether the stage progress is above 0.
     */

    public isStarted(): boolean {
        return this.stage > 0;
    }

    /**
     * Checks if a quest is finished given the current progress and stage count.
     * @returns If the progress is greater or equal to stage count.
     */

    public isFinished(): boolean {
        return this.stage >= this.stageCount;
    }

    /**
     * Returns a StageData object about the current stage. It contains information about
     * what NPC the player must interact with to progress, or how many mobs to kill to
     * progress.
     * @returns StageData object containing potential npc, mob, and stage count.
     */

    public getStageData(): StageData {
        let stage = this.stages[this.stage];

        return {
            task: stage.task!,
            npc: stage.npc! || '',
            mob: stage.mob! || '',
            mobCountRequirement: stage.mobCountRequirement! || 0,
            itemRequirement: stage.itemRequirement! || '',
            itemCountRequirement: stage.itemCountRequirement! || 0,
            text: stage.text! || [''],
            pointer: stage.pointer! || undefined,
            popup: stage.popup! || undefined,
            itemKey: stage.itemKey! || '',
            itemCount: stage.itemCount! || 0
        };
    }

    /**
     * Iterates backwards through our stages starting at the stage we're
     * currently on. If we find a reference to the NPC passed as a parameter,
     * we extract the dialogue for that stage. If the stage we are currently
     * on is higher than the stage we find the NPC in, then we use `completedText`
     * specified in the StageData object.
     * Extra Info: `completedText` refers to text when a user interacts with an NPC
     * that is no longer required for progression to the next stage.
     * @param npc The npc we are trying to find within our stages.
     * @returns An array of strings containing the dialogue.
     */

    private getNPCDialogue(npc: NPC): string[] {
        // Iterate backwards, last reference of the NPC is the text we grab.
        for (let i = this.stage; i > -1; i--) {
            // We do not count iterations of stages above stage we are currently on.
            if (this.stage < i) continue;

            let stage = this.stages[i];

            // If no key is found, continue iterating.
            if (stage.npc! !== npc.key) continue;

            /**
             * If the stage we are currently on is not the same as the most
             * recent stage containing the NPC, then we use the dialogue
             * for after the stage is completed.
             */
            if (this.stage > i) return stage.completedText!;

            return stage.text!;
        }

        return [''];
    }

    /**
     * Sets the stage (and subStage if specified) and makes a callback.
     * @param stage The new stage we are setting the quest to.
     * @param subStage Optionally set the stage to a subStage index.
     * @param progressCallback Conditional on whether we want to make a callback or not.
     */

    public setStage(stage: number, subStage = 0, progressCallback = true): void {
        // Send popup before setting the new stage.
        if (this.stageData.popup) this.popupCallback?.(this.stageData.popup);

        // Clear pointer preemptively if the current stage data contains it.
        if (this.stageData.pointer) this.pointerCallback?.(Modules.EmptyPointer);

        // Progression to a new stage.
        if (this.stage !== stage && progressCallback)
            this.progressCallback?.(this.key, stage, this.stageCount);

        this.stage = stage;
        this.subStage = subStage;

        if (this.isFinished()) return;

        // Update the latest stage data.
        this.stageData = this.getStageData();

        // Check if the current stage has any pointer information.
        if (this.stageData.pointer) this.pointerCallback?.(this.stageData.pointer);
    }

    /**
     * Serializes the quest's data to be stored
     * in the database. Save information such as
     * the quest key and progress.
     */

    public serialize(batch = false): QuestData {
        let data: QuestData = {
            key: this.key,
            stage: this.stage,
            subStage: this.subStage,
            stageCount: this.stageCount
        };

        if (batch) {
            data.name = this.name;
            data.description = this.description;
        }

        return data;
    }

    /**
     * A callback whenever we progress the quest.
     * @param callback The quest's key and progress count;
     */

    public onProgress(callback: (key: string, stage: number, subStage: number) => void): void {
        this.progressCallback = callback;
    }

    /**
     * A callback for whenever a pointer is requested.
     * @param callback Pointer data to be displayed.
     */

    public onPointer(callback: (pointerData: PointerData) => void): void {
        this.pointerCallback = callback;
    }

    /**
     * A callback for whenever a popup is requested.
     * @param callback Popup data that will be displayed to the player.
     */

    public onPopup(callback: (popupData: PopupData) => void): void {
        this.popupCallback = callback;
    }

    /**
     * Callback when a talking action with an NPC occurs.
     * @param callback The NPC the interaction happens with.
     */

    public onTalk(callback: (npc: NPC, player: Player) => void): void {
        this.talkCallback = callback;
    }

    /**
     * Callback for when attempting to go through a door.
     * @param callback Callback containing starting location and destination of the door.
     */

    public onDoor(callback: (quest: ProcessedDoor, player: Player) => void): void {
        this.doorCallback = callback;
    }

    /**
     * Callback for when a mob is killed.
     * @param callback The mob that is being killed.
     */

    public onKill(callback: (mob: Mob) => void): void {
        this.killCallback = callback;
    }
}
