import type Character from '../game/entity/character/character';
import type Combat from '../game/entity/character/combat/combat';

export interface MobDrops {
    [item: string]: number;
}

export interface MobData {
    id: number;
    hiddenName?: boolean;
    key: string;
    name: string;
    xp: number;
    combatPlugin: string;
    hitPoints: number;
    drops: MobDrops;
    spawnDelay: number;
    level: number;
    armour: number;
    weapon: number;
    attackRange: number;
    aggroRange: number;
    aggressive: boolean;
    isPoisonous?: boolean;
    attackRate: number;
    movementSpeed: number;
    projectileName: string | undefined;
}

type CombatPlugin = new (character: Character) => Combat;

export default {
    Properties: {} as { [name: string]: MobData },
    Ids: {} as { [id: number]: MobData },
    Plugins: {} as { [name: string]: CombatPlugin },

    idToString(id: number): string | null {
        if (id in this.Ids) return this.Ids[id].key;

        return null;
    },

    idToName(id: number): string | null {
        if (id in this.Ids) return this.Ids[id].name;

        return null;
    },

    stringToId(name: string): number | null {
        if (name in this.Properties) return this.Properties[name].id;

        return null;
    },

    getXp(id: number): number {
        if (id in this.Ids) return this.Ids[id].xp;

        return -1;
    },

    exists(id: number): boolean {
        return id in this.Ids;
    },

    hasCombatPlugin(id: number): boolean {
        return id in this.Ids && this.Ids[id].combatPlugin in this.Plugins;
    },

    isNewCombatPlugin(id: number): CombatPlugin | undefined {
        if (id in this.Ids && this.Ids[id].combatPlugin in this.Plugins)
            return this.Plugins[this.Ids[id].combatPlugin];
    },

    isHidden(name: string): boolean | undefined {
        if (name in this.Properties) return this.Properties[name].hiddenName;

        return false;
    }
};
