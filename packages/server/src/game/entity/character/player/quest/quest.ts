import Item from '../../../objects/item';

import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';
import { Modules } from '@kaetram/common/network';

import type Player from '../player';
import type Mob from '../../mob/mob';
import type NPC from '../../../npc/npc';
import type { ProcessedDoor } from '@kaetram/common/types/map';
import type { PointerData } from '@kaetram/common/network/impl/pointer';
import type { PopupData } from '@kaetram/common/types/popup';
import type {
    QuestData,
    RawQuest,
    RawStage,
    StageData,
    HideNPC,
    QuestItem
} from '@kaetram/common/network/impl/quest';

type InterfaceCallback = (key: string) => void;
type ProgressCallback = (key: string, stage: number, subStage: number) => void;
type PointerCallback = (pointer: PointerData) => void;
type PopupCallback = (popup: PopupData) => void;

type TalkCallback = (npc: NPC, player: Player) => void;
type DoorCallback = (quest: ProcessedDoor, player: Player) => void;
type KillCallback = (mob: Mob) => void;
type ResourceCallback = (type: Modules.Skills, resourceType: string) => void;

export default abstract class Quest {
    /**
     * An abstract quest class that takes the raw quest data and
     * de-serializes its data into a quest object for later use.
     */

    public name = '';
    private description = '';
    private rewards: string[] = [];
    private skillRequirements: { [key: string]: number } = {};
    private questRequirements: string[] = []; // List of quests required to start this quest.
    private difficulty = ''; // Difficulty of the quest.
    private hideNPCs: HideNPC = {}; // NPCs to hide after quest.
    private completedSubStages: string[] = []; // The substages that the player has completed, used for cases such as talking to an NPC.
    protected stage = 0; // How far along in the quest we are.
    private subStage = 0; // Progress in the substage (say we're tasked to kill 20 rats, or talk to multiple NPCs).
    protected stageCount = 0; // How long the quest is.
    private timer = 0; // Used by timer to indicate duration amount of stage.
    private expiration = 0; // Used by timer to indicate expiration date.
    private pendingStart = false; // Whether or not the quest is pending start.

    protected noPrompts = false; // Used to skip the interface prompts for the quest.

    private stageData: StageData; // Current stage data, constantly updated when progression occurs.
    private stages: { [id: number]: RawStage } = {}; // All the stages from the JSON data.

    // Store all NPCs involved in the quest.
    private npcs: string[] = [];

    private timerTimeout?: NodeJS.Timeout | undefined;

    private startCallback?: InterfaceCallback;
    private progressCallback?: ProgressCallback;
    private pointerCallback?: PointerCallback;
    private popupCallback?: PopupCallback;

    public talkCallback?: TalkCallback;
    public doorCallback?: DoorCallback;
    public killCallback?: KillCallback;
    public resourceCallback?: ResourceCallback;

    public constructor(
        private key: string,
        rawData: RawQuest
    ) {
        this.name = rawData.name;
        this.description = rawData.description;
        this.rewards = rawData.rewards || [];
        this.skillRequirements = rawData.skillRequirements || {};
        this.questRequirements = rawData.questRequirements || [];
        this.difficulty = rawData.difficulty || '';
        this.hideNPCs = rawData.hideNPCs || {};
        this.stageCount = Object.keys(rawData.stages).length;

        this.stages = rawData.stages;

        this.stageData = this.getStageData();

        this.loadNPCs();

        // Callbacks
        this.onTalk(this.handleTalk.bind(this));
        this.onDoor(this.handleDoor.bind(this));
        this.onKill(this.handleKill.bind(this));
        this.onResource(this.handleResource.bind(this));
    }

    /**
     * Blank function for use in subclasses. See `Tutorial.ts`.
     */

    public loaded(): void {
        //log.debug(`[${this.key}] Uninitialized loaded();`);
    }

    /**
     * Parses through all the stages and stores the NPCs that the player
     * will engage with. This is necessary in order to prevent the default
     * dialogue from occurring while the quest is in progress.
     */

    private loadNPCs(): void {
        // Iterate through the stages and extract the NPCs.
        for (let stage of Object.values(this.stages)) {
            // If the stage has sub-stages, iterate through those as well and extract the NPCs.
            if (stage.subStages)
                for (let subStage of stage.subStages)
                    if (subStage.npc && !this.hasNPC(subStage.npc)) this.npcs.push(subStage.npc);

            // Add each NPC to the list if the stage has one and it is not already in the list.
            if (stage.npc && !this.hasNPC(stage.npc)) this.npcs.push(stage.npc);
        }

        // Look through the hideNPCs object and extract the NPCs.
        for (let i in this.hideNPCs) if (!this.hasNPC(i)) this.npcs.push(i);
    }

    /**
     * Callback handler for when a player talks to an NPC.
     * @param npc The NPC that the player interacted with.
     * @param player The player that interacts with the NPC.
     */

    private handleTalk(npc: NPC, player: Player): void {
        //log.debug(`[${this.name}] Talking to NPC: ${npc.key} - stage: ${this.stage}.`);

        // Extract the dialogue for the NPC.
        let dialogue = this.getNPCDialogue(npc, player);

        if (!dialogue) return log.warning(`[${this.name}] No dialogue found for NPC: ${npc.key}.`);

        // Attempt to check for substage component and use that information instead.
        let subStageNPC = this.getSubStageByNPC(npc.key),
            stageInfo = subStageNPC || this.stageData; // Use whichever stage data is present.

        /**
         * Ends the conversation. If the player has the required item in the inventory
         * it will check for that first. If the stage requires the player be given an item
         * it must be given before the conversation ends and quest progresses. If we are dealing
         * with sub stages then we must first ensure the NPC isn't marked as completed and just
         * proceed with the dialogue instead.
         */
        if (
            stageInfo.npc === npc.key &&
            dialogue.length === player.talkIndex &&
            !this.completedSubStages.includes(npc.key)
        )
            if (this.hasItemRequirement(stageInfo)) this.handleItemRequirement(player, stageInfo);
            else if (this.hasItemToGive(stageInfo))
                this.givePlayerRewards(player, stageInfo.itemRewards, true);
            else if (this.hasAbility(stageInfo)) this.givePlayerAbility(player);
            else if (this.hasExperience(stageInfo)) this.givePlayerExperience(player);
            else this.progress();

        // Talk to the NPC and progress the dialogue.
        npc.talk(player, dialogue);
    }

    /**
     * Callback handler for when a player attemps to pass through a door.
     * @param door The door that the player is trying to enter.
     * @param player The player instance that we send actions to.
     */

    protected handleDoor(door: ProcessedDoor, player: Player): void {
        log.debug(`[${this.name}] Door: ${door.x}-${door.y} - stage: ${this.stage}.`);

        if (this.stage < door.stage) return player.notify('misc:CANNOT_PASS_DOOR');

        player.teleport(door.x, door.y);

        // Progress only if the door is a task.
        if (this.isDoorTask()) this.progress();
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

        // Stage progression has expired, so we don't progress.
        if (this.timer && Date.now() - this.timer > this.expiration) return;

        // Substage progression when the mob killed matches the quest's list of mobs.
        if (this.stageData.mob.includes(mob.key)) this.progress(true);

        // Progress to the next stage after we reach the `mobCountRequirement`.
        if (this.subStage >= this.stageData.mobCountRequirement) this.progress();
    }

    /**
     * Callback for when a resource is depleted. Contains the type of resource and the subType
     * for the resource. For example, the type is the SkillType and the subType is the tree type.
     * @param type The skill type of the resource.
     * @param subType The type of resource that was mined (oak, palm, gold, etc.)
     */

    private handleResource(type: Modules.Skills, subType: string): void {
        // Stop if the quest has already been completed.
        if (this.isFinished()) return;

        // Extract the type of resource based on the skill.
        let resourceType = Utils.getResourceType(type),
            resource = this.stageData[resourceType as keyof StageData],
            resourceCount = this.stageData[`${resourceType}Count` as keyof StageData] as number;

        // Stage data does not require a tree to be cut.
        if (!resource) return;

        // Don't progress if we are not cutting the tree specified.
        if (resource !== subType) return;

        // Progress the quest if no tree count is specified but a tree stage is present.
        if (!resourceCount) return this.progress();

        // Progress substage.
        this.progress(true);

        // Progress to next stage if we fulfill the tree count requirement.
        if (this.subStage >= resourceCount) this.progress();
    }

    /**
     * Checks the player's inventory for a particular item and its amount and takes it
     * if the player fulfills the requirement. We also handle giving the player an item
     * reward if the stage contains one, as well as an ability.
     * @param player The player we are checking inventory of.
     * @param stageData The stage data we are checking against, or substage data if specified.
     * @param subStage (Optional) Specified by subbstage progression (in case of multiple NPC requirements).
     */

    private handleItemRequirement(player: Player, stageData: StageData | RawStage): void {
        // Extract the item key and count requirement.
        let { itemRequirements, itemRewards, npc } = stageData;

        // Skip if the player does not have the required item and count in the inventory.
        if (!this.hasAllItems(player, itemRequirements)) return;

        // Skip if the player does not have enough space in the inventory for the item rewards.
        if (itemRewards && !player.inventory.hasSpace(itemRewards.length))
            return player.notify('misc:NO_SPACE');

        // Iterate through the items and remove them from the player's inventory.
        for (let item of itemRequirements!) player.inventory.removeItem(item.key, item.count);

        // If the stage contains item rewards, we give it to the player.
        if (this.hasItemToGive(stageData)) this.givePlayerRewards(player, itemRewards!);

        // Grant the experience from the stage.
        if (this.hasExperience(stageData)) this.givePlayerExperience(player);

        // If the stage rewards an ability, we give it to the player.
        if (this.hasAbility(stageData)) this.givePlayerAbility(player);

        // If we're dealing with substages, we add the NPC to the completed list.
        if (this.stageData.subStages && !this.completedSubStages.includes(npc!))
            this.completedSubStages.push(npc!);

        /**
         * A substage progression occurs if the current overall stage has a substage component
         * and if the amount of completed NPCs is less than the amount of substages.
         */
        let isSubStage =
            this.stageData.subStages &&
            this.completedSubStages.length < this.stageData.subStages.length;

        this.progress(isSubStage);
    }

    /**
     * Used for verifying and progressing the quest via prompts for starting.
     */

    public handlePrompt(): void {
        if (!this.pendingStart || this.isStarted()) return;

        // Progress the stage by skipping prompts.
        this.setStage(this.stage + 1, 0, true, true);
    }

    /**
     * Advances the quest to the next stage.
     */

    private progress(subStage?: boolean): void {
        // Apply the expiration timer if it's present in the current stage.
        if (this.stageData.timer) {
            this.timer = this.stageData.timer;

            this.expiration = Date.now() + this.stageData.timer;
        }

        // Progress substage only if the parameter is defined.
        if (subStage) this.setStage(this.stage, this.subStage + 1);
        else this.setStage(this.stage + 1);
    }

    /**
     * Responsible for giving the player the item rewards in an array. The function must first
     * ensure that the player has enough inventory space for the item rewards.
     * @param player The player we are giving the item to.
     * @param itemRewards The item rewards we are giving to the player.
     * @param progress Whether or not to progress to the next stage after giving the item rewards.
     */

    private givePlayerRewards(
        player: Player,
        itemRewards: QuestItem[] = [],
        progress = false
    ): void {
        // We play it extra safe by ensuring there are at least as many empty spaces as there are reward items.
        if (!player.inventory.hasSpace(itemRewards.length))
            return player.notify(`misc:PLEASE_MAKE_ROOM_REWARD`);

        // Check if the player has enough inventory space for the item rewards.
        for (let item of itemRewards)
            player.inventory.add(new Item(item.key, -1, -1, false, item.count));

        // Progress to the next stage if the parameter is true.
        if (progress) this.progress();
    }

    /**
     * Grants the player an ability and defaults to level 1 if no level is specified.
     * @param player The player we are granting the ability to.
     */

    private givePlayerAbility(player: Player): void {
        player.abilities.add(this.stageData.ability!, this.stageData.abilityLevel || 1);
    }

    /**
     * Iterates through the list of skill rewards and grants the player experience
     * for each skill specified.
     * @param player The player we are granting experience to.
     */

    private givePlayerExperience(player: Player): void {
        for (let skillReward of this.stageData.skillRewards!) {
            let skill = player.skills.get(Utils.getSkill(skillReward.key)!);

            skill?.addExperience(skillReward.experience);
        }
    }

    /**
     * Clears the timer timeout upon progression to the next stage.
     */

    private clearTimer(): void {
        clearTimeout(this.timerTimeout);
        this.timerTimeout = undefined;
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
     * Checks whether the stage parameter provided contains any items. Since the `itemRequirements`
     * may be undefined, we default to an empty array in case it is.
     * @param stageData Contains information about the current stage in a raw format or in a parsed format.
     * @returns If there are any item requirements in the stage provided.
     */

    private hasItemRequirement(stageData: StageData | RawStage): boolean {
        return (stageData.itemRequirements || []).length > 0;
    }

    /**
     * Similarly to `hasItemRequirement`, we check if the stage parameter provided contains
     * any item rewards. Since the `itemRewards` may be undefined, we default to an empty array in case it is.
     * @param stageData Contains information about the current stage in a raw format or in a parsed format.
     * @returns If there are any item rewards in the stage provided.
     */

    private hasItemToGive(stageData: StageData | RawStage): boolean {
        return (stageData.itemRewards || []).length > 0;
    }

    /**
     * Checks whether or not the current stage has an ability to give to the player.
     * @param stageData Contains information about the current stage in a raw format
     * if processing a sub stage, or in a parsed format if processing the main stage.
     * @returns If the `ability` property exists in the current stage.
     */

    private hasAbility(stageData: StageData | RawStage): boolean {
        return !!stageData.ability;
    }

    /**
     * Whether or not the quest grants experience to a skill.
     * @param stageData Contains information about the current stage in a raw format
     * if processing a sub stage, or in a parsed format if processing the main stage.
     * @returns Whether the stage data has an experience property and skill which to grant towards.
     */

    private hasExperience(stageData: StageData | RawStage): boolean {
        return (stageData.skillRewards?.length || 0) > 0;
    }

    /**
     * Checks whether the player has all the items in the specified array of items.
     * Each eleemnt contains a key and a count, we check that against the player's inventory.
     * @param player The player we are checking the inventory of.
     * @param items The array of items we are checking for.
     */

    private hasAllItems(player: Player, items: QuestItem[] = []): boolean {
        let hasItems = true;

        // Iterate and ensure that the player has all the items.
        for (let item of items)
            if (!player.inventory.hasItem(item.key, item.count)) {
                hasItems = false;
                break;
            }

        return hasItems;
    }

    /**
     * Checks if the player meets all of the skill and quest requirements.
     * @param player The player that we are checking the requirements of.
     * @returns Whether or not the player meets all the requirements.
     */

    public hasRequirements(player: Player): boolean {
        // Iterate through the skills and check if the player has the required level.
        for (let skill in this.skillRequirements)
            if (player.skills.get(Utils.getSkill(skill)!).level < this.skillRequirements[skill])
                return false;

        // Iterate through the quests and check if the player has completed them.
        for (let index in this.questRequirements)
            if (!player.quests.get(this.questRequirements[index]).isFinished()) return false;

        return true;
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
     * @param nextStage Whether or not to check the next stage.
     * @returns If the progress is greater or equal to stage count.
     */

    public isFinished(nextStage = false): boolean {
        return (nextStage ? this.stage + 1 : this.stage) >= this.stageCount;
    }

    /**
     * Checks whether the NPC is visible or not depending on the
     * status of the quest and its existence in the hideNPCs dictionary.
     * @param key The key of the NPC we are checking.
     * @returns Boolean value if the NPC is visibile or not.
     */

    public isNPCVisible(key: string): boolean {
        let npc = this.hideNPCs[key];

        if (!npc) return true;

        return npc === 'before' ? this.isFinished() : !this.isFinished();
    }

    /**
     * Whether or not the current stage we're on requires that the player
     * talk to an NPC.
     * @param npc The NPC we are checking.
     * @returns Whether or not the NPC is the NPC required for the current stage.
     */

    public isNPCForStage(player: Player, npc: NPC): boolean {
        let stage = this.getStageData();

        // NPC is not in the current stage so we just skip.
        if (stage.npc !== npc.key) return false;

        // If the stage doesn't have any item requirements, then the NPC belongs to the stage and the player must talk to them.
        if (!this.hasItemRequirement(stage)) return true;

        // If the player has all the requirements for the stage.
        if (this.hasAllItems(player, stage.itemRequirements)) return true;

        return false;
    }

    /**
     * @returns Whether or not the current task is to walk through a door.
     */

    private isDoorTask(): boolean {
        return this.stageData.task === 'door';
    }

    /**
     * @returns Whether or not the current stage is a kill task.
     */

    public isKillTask(): boolean {
        return this.stageData.task === 'kill';
    }

    /**
     * @returns Whether or not the current stage is a cut tree task.
     */

    public isCutTreeTask(): boolean {
        return this.stageData.task === 'tree';
    }

    /**
     * @returns Whether or not the current stage is a fish task.
     */

    public isFishingTask(): boolean {
        return this.stageData.task === 'fish';
    }

    /**
     * Attempts to grab a sub stage NPC if it exists. Sub stage NPCs are those
     * that a player must talk to multiple (in any order) in order to progress.
     * @param key The key of the NPC we are trying to grab.
     * @returns A StageNPC object if it exists, undefined otherwise.
     */

    public getSubStageByNPC(key: string): RawStage | undefined {
        if (!this.stageData.subStages) return undefined;

        return this.stageData.subStages.find((subStage: RawStage) => subStage.npc === key);
    }

    /**
     * @returns The stage the quest is currently on.
     */

    public getStage(): number {
        return this.stage;
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
            task: stage.task,
            subStages: stage.subStages || [],
            npc: stage.npc || '',
            mob: stage.mob! || '',
            mobCountRequirement: stage.mobCountRequirement || 0,
            itemRequirements: stage.itemRequirements || [],
            itemRewards: stage.itemRewards || [],
            text: stage.text || [''],
            pointer: stage.pointer || undefined,
            popup: stage.popup || undefined,
            tree: stage.tree || '',
            treeCount: stage.treeCount || 0,
            fish: stage.fish || '',
            fishCount: stage.fishCount || 0,
            rock: stage.rock || '',
            rockCount: stage.rockCount || 0,
            skillRewards: stage.skillRewards || [],
            timer: stage.timer || 0
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

    private getNPCDialogue(npc: NPC, player: Player): string[] {
        // Iterate backwards, last reference of the NPC is the text we grab.
        for (let i = this.stage; i > -1; i--) {
            // We do not count iterations of stages above stage we are currently on.
            if (this.stage < i) continue;

            let stage = this.stages[i],
                subStage = this.getSubStageByNPC(npc.key);

            // If no key is found, continue iterating.
            if (stage.npc! !== npc.key && !subStage) continue;

            // Substitute the sub stage information into the stage and use that to process the dialogue.
            if (subStage) stage = subStage;

            /**
             * If we are dealing with substages, then we want to return the completed
             * text for the particular substage if it has been completed.
             */

            if (subStage && this.completedSubStages.includes(subStage.npc!))
                return stage.completedText!;

            // Ensure we are on the correct stage and that it has an item requirement, otherwise skip.
            if (this.hasItemRequirement(stage) && this.stage === i) {
                // Verify that the player has the required items and return the dialogue for it.
                if (this.hasAllItems(player, stage.itemRequirements)) return stage.hasItemText!;

                // Skip to next stage iteration.
                continue;
            }

            /**
             * If the stage we are currently on is not the same as the most
             * recent stage containing the NPC, then we use the dialogue
             * for after the stage is completed.
             */
            if (this.stage > i) return stage.completedText!;

            return stage.text!;
        }

        // The default text witll be the `text` array of strings.
        if (this.stageData.npc === npc.key) return this.stageData.text!;

        return [''];
    }

    /**
     * Sets the stage (and subStage if specified) and makes a callback.
     * @param stage The new stage we are setting the quest to.
     * @param subStage Optionally set the stage to a subStage index.
     * @param progressCallback Conditional on whether we want to make a callback or not.
     * @param skipPrompts Whether to skip the starting/completing prompts
     */

    public setStage(
        stage: number,
        subStage = 0,
        progressCallback = true,
        skipPrompts = false
    ): void {
        let isProgress = this.stage !== stage;

        // Send popup before setting the new stage.
        if (this.stageData.popup) this.popupCallback?.(this.stageData.popup);

        // Clear pointer preemptively if the current stage data contains it.
        if (this.stageData.pointer) this.pointerCallback?.(Modules.EmptyPointer);

        // Clear the timer timeout.
        this.clearTimer();

        // Certain quests can skip the prompts (like the tutorial for example).
        if (!this.noPrompts && !skipPrompts && progressCallback && !this.isStarted()) {
            this.pendingStart = true;
            return this.startCallback?.(this.key);
        }

        // Reset the pending flags.
        this.pendingStart = false;

        this.stage = stage;
        this.subStage = subStage;

        /**
         * Progression to a new stage occurs when the stage we are setting is different
         * from the stage we are currently on. Unless we are explicitly avoiding
         * progression callbacks, we make one.
         */

        if (isProgress && progressCallback) {
            // Clear the completed substages.
            this.completedSubStages = [];

            // Callback so that we send information to the player.
            this.progressCallback?.(this.key, stage, this.stageCount);
        }

        if (this.isFinished()) return;

        // Update the latest stage data.
        this.stageData = this.getStageData();

        // Handle loading a stage that has a timer
        if (this.stageData.timer)
            if (progressCallback) {
                this.timer = this.stageData.timer;
                this.expiration = Date.now() + this.timer;

                // Create a timeout to roll back the stage if the timer expires without progression.
                this.timerTimeout = setTimeout(() => this.setStage(stage - 1), this.timer);
            } else this.setStage(stage - 1);

        // Check if the current stage has any pointer information.
        if (this.stageData.pointer) this.pointerCallback?.(this.stageData.pointer);
    }

    /**
     * Updates the quest's completed substages. These are the keys of the substages
     * that the player has completed. We use this function when we load the information
     * from the database.
     */

    public setCompletedSubStages(subStages: string[] = []): void {
        this.completedSubStages = subStages;
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
            completedSubStages: this.completedSubStages
        };

        if (batch) {
            data.name = this.name;
            data.description = this.description;
            data.rewards = this.rewards;
            data.skillRequirements = this.skillRequirements;
            data.questRequirements = this.questRequirements;
            data.difficulty = this.difficulty;
            data.stageCount = this.stageCount;
        }

        return data;
    }

    /**
     * Callback for when we want to prompt the player to start
     * the quest. The quest will not progress until the player
     * manually accepts the quest.
     * @param callback Contains the key for the quest that we are starting.
     */

    public onStart(callback: InterfaceCallback): void {
        this.startCallback = callback;
    }

    /**
     * A callback whenever we progress the quest.
     * @param callback The quest's key and progress count;
     */

    public onProgress(callback: ProgressCallback): void {
        this.progressCallback = callback;
    }

    /**
     * A callback for whenever a pointer is requested.
     * @param callback Pointer data to be displayed.
     */

    public onPointer(callback: PointerCallback): void {
        this.pointerCallback = callback;
    }

    /**
     * A callback for whenever a popup is requested.
     * @param callback Popup data that will be displayed to the player.
     */

    public onPopup(callback: PopupCallback): void {
        this.popupCallback = callback;
    }

    /**
     * Callback when a talking action with an NPC occurs.
     * @param callback The NPC the interaction happens with.
     */

    public onTalk(callback: TalkCallback): void {
        this.talkCallback = callback;
    }

    /**
     * Callback for when attempting to go through a door.
     * @param callback Callback containing starting location and destination of the door.
     */

    public onDoor(callback: DoorCallback): void {
        this.doorCallback = callback;
    }

    /**
     * Callback for when a mob is killed.
     * @param callback The mob that is being killed.
     */

    public onKill(callback: KillCallback): void {
        this.killCallback = callback;
    }

    /**
     * Callback for when a resource has been exhausted
     * @param callback Contains the resource type and identifier of the resource.
     */

    public onResource(callback: ResourceCallback): void {
        this.resourceCallback = callback;
    }
}
