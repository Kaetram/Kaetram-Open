import _ from 'lodash';

import NPC from '../../npc/npc';
import Mob from '../mob/mob';
import Player from './player';

import Achievement from './achievement/achievement';

import achievements from '../../../../../data/achievements.json';

import { Achievement as AchievementPacket } from '../../../../network/packets';

import { PopupData } from '@kaetram/common/types/popup';
import {
    RawAchievement,
    AchievementData,
    SerializedAchievement
} from '@kaetram/common/types/achievement';
import { Opcodes } from '@kaetram/common/network';
import Item from '../../objects/item';

export default class Achievements {
    private achievements: { [key: string]: Achievement } = {};

    private loadCallback?: () => void;

    public constructor(private player: Player) {
        // Iterates through the raw achievement information from the JSON.
        _.each(achievements, (rawAchievement: RawAchievement, key: string) => {
            let achievement = new Achievement(key, rawAchievement);

            this.achievements[key] = achievement;

            achievement.onFinish(this.handleFinish.bind(this));
            achievement.onProgress(this.handleProgress.bind(this));
            achievement.onPopup(this.handlePopup.bind(this));
        });
    }

    /**
     * Iterates through database information of achievements.
     * @param achievementInfo Array data containing information
     * about each achievement (key and stage).
     */

    public load(achievementInfo: AchievementData[]): void {
        // Iterates through the achievement information and updates data.
        _.each(achievementInfo, (info: AchievementData) => {
            let achievement = this.get(info.key);

            // Update stage if achievement exists.
            if (achievement) achievement.setStage(info.stage, true);
        });

        this.loadCallback?.();
    }

    /**
     * Handles the reward of an achievement when it is finished.
     * @param itemKey The key of the item we are rewarding.
     * @param itemCount Amount of an item we are rewarding.
     * @param experience How much experience we are rewarding to the player.
     */

    private handleFinish(itemKey?: string, itemCount?: number, experience?: number): void {
        // Handles an item reward.
        if (itemKey) {
            let item = new Item(itemKey, -1, -1, true, itemCount);

            // Check if we can add to the inventory, then the bank, and if both fail just drop the item.
            if (!this.player.inventory.add(item) && !this.player.bank.add(item))
                this.player.world.entities.spawnItem(
                    itemKey,
                    this.player.x,
                    this.player.y,
                    true,
                    itemCount
                );
        }

        // Add experience if it exists.
        if (experience) this.player.addExperience(experience);
    }

    /**
     * Handles the callback for when an achievement progresses. It
     * sends a packet to the client notifying it of an update.
     * @param key The key of the achievement we are updating.
     * @param stage The new stage of the achievement.
     * @param name The name of the achievement after discovering (or before).
     */

    private handleProgress(key: string, stage: number, name: string): void {
        this.player.send(
            new AchievementPacket(Opcodes.Achievement.Progress, {
                key,
                stage,
                name
            })
        );
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
            if (entity.isNPC() && !a.hasNPC(entity as NPC)) return;
            if (entity.isMob() && !a.hasMob(entity as Mob)) return;

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
        _.each(this.achievements, callback);
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

        this.forEachAchievement((achievement: Achievement) =>
            achievements.push(achievement.serialize(withInfo))
        );

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
