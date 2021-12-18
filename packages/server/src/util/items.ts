import log from '@kaetram/common/util/log';

import type { Plugin } from '../../data/plugins';

export interface ItemsData {
    key: string;
    customData: {
        healAmount: number;
        manaAmount: number;
    };
    healsHealth: number;
    healsMana: number;
    id: number;
    type: string;
    name: string;
    stackable: boolean;
    edible: boolean;
    maxStackSize: number;
    plugin: string;
    price: number;
    storeCount: number;
    requirement: number;
    attack: number;
    defense: number;
    pendantLevel: number;
    ringLevel: number;
    bootsLevel: number;
    lumberjacking: number;
    mining: number;
    movementSpeed: number;
}

type ItemsPlugin = new (id: number) => Plugin;

export default {
    Data: {} as { [name: string]: ItemsData },
    Ids: {} as { [id: number]: ItemsData },
    // onCreate: {},
    Plugins: {} as { [id: number]: ItemsPlugin },

    getData(name: string): ItemsData | 'null' {
        if (name in this.Data) return this.Data[name];

        return 'null';
    },

    hasPlugin(id: number): boolean {
        return id in this.Plugins;
    },

    getPlugin(id: number): ItemsPlugin | null {
        if (this.hasPlugin(id)) return this.Plugins[id];

        return null;
    },

    idToString(id: number): string {
        if (id in this.Ids) return this.Ids[id].key;

        return 'null';
    },

    idToName(id: number): string {
        if (id in this.Ids) return this.Ids[id].name;

        return 'null';
    },

    stringToId(name: string): number | null {
        if (name in this.Data) return this.Data[name].id;
        log.error(`Item: ${name} not found in the database.`);

        return null;
    },

    getLevelRequirement(name: string): number {
        let level = 0;

        if (!name) return level;

        let item = this.Data[name];

        if (item && item.requirement) return item.requirement;

        if (this.isWeapon(name)) level = this.Data[name].attack;
        else if (this.isArmour(name)) level = this.Data[name].defense;
        else if (this.isPendant(name)) level = this.Data[name].pendantLevel;
        else if (this.isRing(name)) level = this.Data[name].ringLevel;
        else if (this.isBoots(name)) level = this.Data[name].bootsLevel;

        return level * 2;
    },

    getLumberjackingLevel(weaponName: string): number {
        if (this.isWeapon(weaponName)) return this.Data[weaponName].lumberjacking;

        return -1;
    },

    getMiningLevel(weaponName: string): number {
        if (this.isWeapon(weaponName)) return this.Data[weaponName].mining;

        return -1;
    },

    getWeaponLevel(weaponName: string): number {
        if (this.isWeapon(weaponName)) return this.Data[weaponName].attack;

        return -1;
    },

    getArmourLevel(armourName: string): number {
        if (this.isArmour(armourName)) return this.Data[armourName].defense;

        return -1;
    },

    getPendantLevel(pendantName: string): number {
        if (this.isPendant(pendantName)) return this.Data[pendantName].pendantLevel;

        return -1;
    },

    getRingLevel(ringName: string): number {
        if (this.isRing(ringName)) return this.Data[ringName].ringLevel;

        return -1;
    },

    getBootsLevel(bootsName: string): number {
        if (this.isBoots(bootsName)) return this.Data[bootsName].bootsLevel;

        return -1;
    },

    isArcherWeapon(string: string): boolean {
        if (string in this.Data) return this.Data[string].type === 'weaponarcher';

        return false;
    },

    isWeapon(string: string): boolean {
        if (string in this.Data)
            return this.Data[string].type === 'weapon' || this.Data[string].type === 'weaponarcher';

        return false;
    },

    isArmour(string: string): boolean {
        if (string in this.Data)
            return this.Data[string].type === 'armor' || this.Data[string].type === 'armorarcher';

        return false;
    },

    isPendant(string: string): boolean {
        if (string in this.Data) return this.Data[string].type === 'pendant';

        return false;
    },

    isRing(string: string): boolean {
        if (string in this.Data) return this.Data[string].type === 'ring';

        return false;
    },

    isBoots(string: string): boolean {
        if (string in this.Data) return this.Data[string].type === 'boots';

        return false;
    },

    getType(id: number): string | null {
        if (id in this.Ids) return this.Ids[id].type;

        return null;
    },

    isStackable(id: number): boolean {
        if (id in this.Ids) return this.Ids[id].stackable;

        return false;
    },

    isEdible(id: number): boolean {
        if (id in this.Ids) return this.Ids[id].edible;

        return false;
    },

    getCustomData(id: number): { healAmount: number; manaAmount: number } | null {
        if (id in this.Ids) return this.Ids[id].customData;

        return null;
    },

    maxStackSize(id: number): number {
        if (id in this.Ids) return this.Ids[id].maxStackSize;

        return -1;
    },

    isShard(id: number): boolean {
        return id === 253 || id === 254 || id === 255 || id === 256 || id === 257;
    },

    isEnchantable(id: number): boolean {
        return this.getType(id) !== 'object' && this.getType(id) !== 'craft';
    },

    getShardTier(id: number): number | undefined {
        switch (id) {
            case 253:
                return 1;
            case 254:
                return 2;
            case 255:
                return 3;
            case 256:
                return 4;
            case 257:
                return 5;
            // No default
        }
    },

    isEquippable(string: string): boolean {
        return (
            this.isArmour(string) ||
            this.isWeapon(string) ||
            this.isPendant(string) ||
            this.isRing(string) ||
            this.isBoots(string)
        );
    },

    healsHealth(id: number): boolean {
        if (id in this.Ids) return this.Ids[id].healsHealth > 0;

        return false;
    },

    getMovementSpeed(string: string): number | null {
        if (string in this.Data) return this.Data[string].movementSpeed;

        return null;
    },

    healsMana(id: number): boolean | undefined {
        if (id in this.Ids) return this.Ids[id].healsMana > 0;
    },

    getHealingFactor(id: number): number {
        if (id in this.Ids) return this.Ids[id].healsHealth;

        return 0;
    },

    getManaFactor(id: number): number {
        if (id in this.Ids) return this.Ids[id].healsMana;
        return 0;
    }
};
