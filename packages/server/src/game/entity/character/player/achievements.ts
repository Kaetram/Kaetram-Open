import Achievement from './achievement/achievement';

import achievements from '../../../../../data/achievements.json';
import { Achievement as AchievementPacket } from '../../../../network/packets';
import Item from '../../objects/item';

import { Opcodes } from '@kaetram/common/network';

import type { Modules } from '@kaetram/common/network';
import type { AchievementData, SerializedAchievement } from '@kaetram/common/types/achievement';
import type { PopupData } from '@kaetram/common/types/popup';
import type NPC from '../../npc/npc';
import type Mob from '../mob/mob';
import type Player from './player';

export default class Achievements {
    private achievements: { [key: string]: Achievement } = {};

    private loadCallback?: () => void;

    public constructor(private player: Player) {
        // Iterates through the raw achievement information from the JSON.
        for (let key in achievements) {
            let achievement = new Achievement(key, achievements[key as keyof typeof achievements]);

            this.achievements[key] = achievement;

            achievement.onFinish(this.handleFinish.bind(this));
            achievement.onProgress(this.handleProgress.bind(this));
            achievement.onPopup(this.handlePopup.bind(this));
        }
    }

    /**
     * Iterates through database information of achievements.
     * @param achievementInfo Array data containing information
     * about each achievement (key and stage).
     */

    public load(achievementInfo: AchievementData[]): void {
        // Iterates through the achievement information and updates data.
        for (let info of achievementInfo) {
            let achievement = this.get(info.key);

            // Update stage if achievement exists.
            if (achievement) achievement.setStage(info.stage, true);
        }

        this.loadCallback?.();
    }

    /**
     * Handles the reward of an achievement when it is finished.
     * @param itemKey The key of the item we are rewarding.
     * @param itemCount Amount of an item we are rewarding.
     * @param experience How much experience we are rewarding to the player.
     * @param ability The ability we are rewarding.
     * @param abilityLevel The level of the ability we are rewarding.
     */

    private handleFinish(
        skill: Modules.Skills,
        experience?: number,
        itemKey?: string,
        itemCount?: number,
        ability?: string,
        abilityLevel?: number
    ): void {
        // Handles an item reward.
        if (itemKey) {
            let item = new Item(itemKey, -1, -1, true, itemCount);

            // Check if we can add to the inventory, then the bank, and if both fail just drop the item.
            if (this.player.inventory.add(item) < 1 && this.player.bank.add(item) < 1)
                this.player.world.entities.spawnItem(
                    itemKey,
                    this.player.x,
                    this.player.y,
                    true,
                    itemCount
                );
        }

        // Add experience if it exists.
        if (skill > -1 && experience) this.player.skills.get(skill)?.addExperience(experience);

        // Add ability if it exists.
        if (ability) this.player.abilities.add(ability, abilityLevel!);

        // Update dynamic tiles.
        this.player.updateRegion();
        this.player.save();
    }

    /**
     * Handles the callback for when an achievement progresses. It
     * sends a packet to the client notifying it of an update.
     * @param key The key of the achievement we are updating.
     * @param stage The new stage of the achievement.
     * @param name The name of the achievement after discovering (or before).
     * @param description The description of the achievement after discovering (or before).
     */

    private handleProgress(key: string, stage: number, name: string, description: string): void {
        this.player.send(
            new AchievementPacket(Opcodes.Achievement.Progress, {
                key,
                stage,
                name,
                description
            })
        );

        this.player.updateEntities();
        this.player.save();
    }

    /**
     * Callback handler for when the achievement requests to display a popup.
     * @param popup Popup information such as title, text, colour.
     */

    private handlePopup(popup: PopupData): void {
        this.player.popup(popup.title, popup.text, popup.colour);
    }

    /**
     * Grabs an achievement based on the key provided.
     * @param key The key of the achievement.
     * @returns An achievement object or undefined if not existent.
     */

    public get(key: string): Achievement {
        return this.achievements[key];
    }

    /**
     * Checks an entity (that can be a mob or NPC) to see if any of the
     * achievements contain information about it. Achievements must not
     * be completed to return a valid object, otherwise an undefined is returned.
     * @param entity The entity we are checking, either a mob or an NPC.
     * @returns An achievement object if found, otherwise undefiend.
     */

    public getAchievementFromEntity(entity: NPC | Mob): Achievement | undefined {
        let achievement;

        this.forEachAchievement((a: Achievement) => {
            if (a.isFinished()) return;
            if (entity.isNPC() && !a.hasNPC(entity)) return;
            if (entity.isMob() && (!a.hasMob(entity) || !a.isStarted())) return;

            achievement = a;
        });

        return achievement;
    }

    /**
     * Iterates through all the initialized achievements and
     * creates a callback with the achievement.
     * @param callback Achievement currently being iterated.
     */

    public forEachAchievement(callback: (achievement: Achievement) => void): void {
        for (let achievement of Object.values(this.achievements)) callback(achievement);
    }

    /**
     * Serializes the achievement data into a batch format. If
     * the batch parameter is specified, we include additional
     * data for the client. Otherwise it is purely for being
     * stored into the database.
     * @param withInfo Denotes whether or not to include additional information.
     * This information is generally used when sending data to the client.
     * @returns A serialized object containing array of achievements.
     */

    public serialize(withInfo = false): SerializedAchievement {
        let achievements: AchievementData[] = [];

        this.forEachAchievement((achievement: Achievement) => {
            // Skip secret achievements that are not finished.
            if (achievement.secret && !achievement.isFinished()) return;

            achievements.push(achievement.serialize(withInfo));
        });

        return {
            achievements
        };
    }

    /**
     * Callback signal for when achievements are loaded.
     */

    public onLoaded(callback: () => void): void {
        this.loadCallback = callback;
    }
}
