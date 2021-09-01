import _ from 'lodash';

import config from '@kaetram/common/config';
import { Modules, Opcodes } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';

import Messages from '../../../../network/messages';
import NPCs from '../../../../util/npcs';
import Shops from '../../../../util/shops';
import Hit from '../combat/hit';

import type Areas from '../../../../map/areas/areas';
import type Entity from '../../entity';
import type NPC from '../../npc/npc';
import type Mob from '../mob/mob';
import type Player from './player';

export default class Handler {
    private world;
    private map;

    private updateTicks = 0;
    private updateInterval: NodeJS.Timeout | null = null;

    public constructor(private player: Player) {
        this.world = player.world;
        this.map = player.world.map;

        this.load();
    }

    private load(): void {
        this.updateInterval = setInterval(() => {
            this.detectAggro();

            if (this.updateTicks % 4 === 0)
                // Every 4 (1.6 seconds) update ticks.
                this.handlePoison();

            if (this.updateTicks % 16 === 0)
                // Every 16 (6.4 seconds) update ticks.
                this.player.cheatScore = 0;

            if (this.updateTicks > 100)
                // Reset them every now and then.
                this.updateTicks = 0;

            this.updateTicks++;
        }, 400);

        this.player.onMovement((x: number, y: number) => {
            this.player.checkRegions();

            this.detectAreas(x, y);
            this.detectLights(x, y);

            this.detectClipping(x, y);
        });

        this.player.onDeath(() => {
            this.player.combat.stop();
            this.player.professions.stopAll();
        });

        this.player.onHit((attacker, damage) => {
            /**
             * Handles actions whenever the player
             * instance is hit by 'damage' amount
             */

            if (this.player.combat.isRetaliating()) this.player.combat.begin(attacker);

            log.debug(`Player has been hit - damage: ${damage}`);
        });

        this.player.onKill((character) => {
            if (!this.player.quests) {
                log.warning(`${this.player.username} does not have quests initialized.`);
                return;
            }

            let mob = character as Mob;

            if (this.player.quests.isAchievementMob(mob)) {
                let achievement = this.player.quests.getAchievementByMob(mob);

                if (achievement && achievement.isStarted()) achievement.step();
            }
        });

        this.player.onRegion(() => {
            this.player.lastRegionChange = Date.now();

            this.world.region.handle(this.player);
            this.world.region.push(this.player);
        });

        this.player.connection.onClose(() => {
            this.player.stopHealing();

            /* Avoid a memory leak */
            if (this.updateInterval) clearInterval(this.updateInterval);
            this.updateInterval = null;

            if (this.player.ready) {
                if (config.discordEnabled)
                    this.world.discord.sendWebhook(this.player.username, 'has logged out!');

                if (config.hubEnabled)
                    this.world.api.sendChat(
                        Utils.formatUsername(this.player.username),
                        'has logged out!'
                    );
            }

            this.world.entities.removePlayer(this.player);
        });

        this.player.onTalkToNPC((npc: NPC) => {
            if (this.player.quests.isQuestNPC(npc)) {
                this.player.quests.getQuestByNPC(npc)!.triggerTalk(npc);

                return;
            }

            if (this.player.quests.isAchievementNPC(npc)) {
                this.player.quests.getAchievementByNPC(npc)!.converse(npc);

                return;
            }

            if (Shops.isShopNPC(npc.id)) {
                this.world.shops.open(this.player, npc.id);
                return;
            }

            switch (NPCs.getType(npc.id)) {
                case 'banker':
                    this.player.send(new Messages.NPC(Opcodes.NPC.Bank, {}));
                    return;

                case 'enchanter':
                    this.player.send(new Messages.NPC(Opcodes.NPC.Enchant, {}));
                    break;
            }

            let text = NPCs.getText(npc.id);

            if (!text) return;

            this.player.send(
                new Messages.NPC(Opcodes.NPC.Talk, {
                    id: npc.instance,
                    text: npc.talk(text, this.player)
                })
            );
        });

        this.player.onTeleport((x: number, y: number, isDoor = false) => {
            if (!this.player.finishedTutorial() && isDoor && this.player.doorCallback) {
                this.player.doorCallback(x, y);
                return;
            }
        });

        this.player.onPoison((info) => {
            this.player.sync();

            if (info) this.player.notify('You have been poisoned.');
            else this.player.notify('The poison has worn off.');

            log.debug(`Player ${this.player.instance} updated poison status.`);
        });

        this.player.onCheatScore(() => {
            /**
             * This is a primitive anti-cheating system.
             * It will not accomplish much, but it is enough for now.
             */

            if (this.player.cheatScore > 10) this.player.timeout();

            log.debug(`Cheat score - ${this.player.cheatScore}`);
        });
    }

    public destroy(): void {
        if (this.updateInterval) clearInterval(this.updateInterval);
        this.updateInterval = null;
    }

    private detectAggro(): void {
        let region = this.world.region.regions[this.player.region!];

        if (!region) return;

        _.each(region.entities, (character) => {
            if (character && character.type === 'mob' && this.canEntitySee(character)) {
                let mob = character as Mob,
                    aggro = mob.canAggro(this.player);

                if (aggro) mob.combat.begin(this.player);
            }
        });
    }

    private detectAreas(x: number, y: number): void {
        this.map.forEachAreas((areas: Areas, name: string) => {
            let info = areas.inArea(x, y);

            switch (name) {
                case 'pvp':
                    return this.player.updatePVP(!!info);

                case 'music':
                    return this.player.updateMusic(info);

                case 'overlay':
                    return this.player.updateOverlay(info);

                case 'camera':
                    return this.player.updateCamera(info);

                case 'achievements':
                    if (!info || !info.achievement) return;

                    if (!this.player.achievementsLoaded) return;

                    this.player.finishAchievement(info.achievement);

                    break;

                case 'door':
                    break;
            }
        });
    }

    private detectLights(x: number, y: number): void {
        _.each(this.map.lights, (light) => {
            let { id } = light;

            if (this.map.nearLight(light, x, y) && !this.player.hasLoadedLight(id)) {
                // Add a half a tile offset so the light is centered on the tile.

                this.player.lightsLoaded.push(id);
                this.player.send(new Messages.Overlay(Opcodes.Overlay.Lamp, light));
            }
        });
    }

    private detectClipping(x: number, y: number): void {
        let isColliding = this.map.isColliding(x, y);

        if (!isColliding) return;

        this.player.incoming.handleNoClip(x, y);
    }

    private handlePoison(): void {
        if (!this.player.poison) return;

        let info = this.player.poison.split(':'),
            date = parseInt(info[0]),
            time = parseInt(info[1]),
            damage = parseInt(info[2]),
            timeDiff = Date.now() - date;

        if (timeDiff > time) {
            this.player.setPoison('');
            return;
        }

        let hit = new Hit(Modules.Hits.Poison, damage);

        hit.poison = true;

        this.player.combat.hit(this.player, this.player, hit.getData());
    }

    private canEntitySee(entity: Entity): boolean {
        return !this.player.hasInvisible(entity) && !this.player.hasInvisibleId(entity.id);
    }
}
