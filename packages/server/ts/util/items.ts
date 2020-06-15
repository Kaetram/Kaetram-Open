import log from '../util/log';

export default {
    Data: {},
    Ids: {},
    onCreate: {},
    Plugins: {},

    getData(name: string) {
        if (name in this.Data) return this.Data[name];

        return 'null';
    },

    hasPlugin(id: number) {
        if (id in this.Plugins) return true;

        return false;
    },

    getPlugin(id: number) {
        if (this.hasPlugin(id)) return this.Plugins[id];

        return null;
    },

    idToString(id: number) {
        if (id in this.Ids) return this.Ids[id].key;

        return 'null';
    },

    idToName(id: number) {
        if (id in this.Ids) return this.Ids[id].name;

        return 'null';
    },

    stringToId(name: string) {
        if (name in this.Data) return this.Data[name].id;
        else log.error('Item: ' + name + ' not found in the database.');

        return 'null';
    },

    getLevelRequirement(name: string) {
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

    getLumberjackingLevel(weaponName: string) {
        if (this.isWeapon(weaponName))
            return this.Data[weaponName].lumberjacking;

        return -1;
    },

    getMiningLevel(weaponName: string) {
        if (this.isWeapon(weaponName)) return this.Data[weaponName].mining;

        return -1;
    },

    getWeaponLevel(weaponName: string) {
        if (this.isWeapon(weaponName)) return this.Data[weaponName].attack;

        return -1;
    },

    getArmourLevel(armourName: string) {
        if (this.isArmour(armourName)) return this.Data[armourName].defense;

        return -1;
    },

    getPendantLevel(pendantName: string) {
        if (this.isPendant(pendantName))
            return this.Data[pendantName].pendantLevel;

        return -1;
    },

    getRingLevel(ringName: string) {
        if (this.isRing(ringName)) return this.Data[ringName].ringLevel;

        return -1;
    },

    getBootsLevel(bootsName: string) {
        if (this.isBoots(bootsName)) return this.Data[bootsName].bootsLevel;

        return -1;
    },

    isArcherWeapon(string: string) {
        if (string in this.Data)
            return this.Data[string].type === 'weaponarcher';

        return false;
    },

    isWeapon(string: string) {
        if (string in this.Data)
            return (
                this.Data[string].type === 'weapon' ||
                this.Data[string].type === 'weaponarcher'
            );

        return false;
    },

    isArmour(string: string) {
        if (string in this.Data)
            return (
                this.Data[string].type === 'armor' ||
                this.Data[string].type === 'armorarcher'
            );

        return false;
    },

    isPendant(string: string) {
        if (string in this.Data) return this.Data[string].type === 'pendant';

        return false;
    },

    isRing(string: string) {
        if (string in this.Data) return this.Data[string].type === 'ring';

        return false;
    },

    isBoots(string: string) {
        if (string in this.Data) return this.Data[string].type === 'boots';

        return false;
    },

    getType(id: number) {
        if (id in this.Ids) return this.Ids[id].type;

        return null;
    },

    isStackable(id: number) {
        if (id in this.Ids) return this.Ids[id].stackable;

        return false;
    },

    isEdible(id: number) {
        if (id in this.Ids) return this.Ids[id].edible;

        return false;
    },

    getCustomData(id: number) {
        if (id in this.Ids) return this.Ids[id].customData;

        return null;
    },

    maxStackSize(id: number) {
        if (id in this.Ids) return this.Ids[id].maxStackSize;

        return false;
    },

    isShard(id: number) {
        return (
            id === 253 || id === 254 || id === 255 || id === 256 || id === 257
        );
    },

    isEnchantable(id: number) {
        return this.getType(id) !== 'object' && this.getType(id) !== 'craft';
    },

    getShardTier(id: number) {
        if (id === 253) return 1;
        else if (id === 254) return 2;
        else if (id === 255) return 3;
        else if (id === 256) return 4;
        else if (id === 257) return 5;
    },

    isEquippable(string: string) {
        return (
            this.isArmour(string) ||
            this.isWeapon(string) ||
            this.isPendant(string) ||
            this.isRing(string) ||
            this.isBoots(string)
        );
    },

    healsHealth(id: number) {
        if (id in this.Ids) return this.Ids[id].healsHealth > 0;

        return false;
    },

    getMovementSpeed(string: string) {
        if (string in this.Data) return this.Data[string].movementSpeed;

        return null;
    },

    healsMana(id: number) {
        if (id in this.Ids) return this.Ids[id].healsMana > 0;
    },

    getHealingFactor(id: number) {
        if (id in this.Ids) return this.Ids[id].healsHealth;

        return 0;
    },

    getManaFactor(id: number) {
        if (id in this.Ids) return this.Ids[id].healsMana;
        return 0;
    },
};
