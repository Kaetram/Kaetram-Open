import log from '../util/log';

export default {
    Data: {},
    Ids: {},
    onCreate: {},
    Plugins: {},

    getData(name) {
        if (name in this.Data) return this.Data[name];

        return 'null';
    },

    hasPlugin(id) {
        if (id in this.Plugins) return true;

        return false;
    },

    getPlugin(id) {
        if (this.hasPlugin(id)) return this.Plugins[id];

        return null;
    },

    idToString(id) {
        if (id in this.Ids) return this.Ids[id].key;

        return 'null';
    },

    idToName(id) {
        if (id in this.Ids) return this.Ids[id].name;

        return 'null';
    },

    stringToId(name) {
        if (name in this.Data) return this.Data[name].id;
        else log.error('Item: ' + name + ' not found in the database.');

        return 'null';
    },

    getLevelRequirement(name) {
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

    getLumberjackingLevel(weaponName) {
        if (this.isWeapon(weaponName))
            return this.Data[weaponName].lumberjacking;

        return -1;
    },

    getMiningLevel(weaponName) {
        if (this.isWeapon(weaponName)) return this.Data[weaponName].mining;

        return -1;
    },

    getWeaponLevel(weaponName) {
        if (this.isWeapon(weaponName)) return this.Data[weaponName].attack;

        return -1;
    },

    getArmourLevel(armourName) {
        if (this.isArmour(armourName)) return this.Data[armourName].defense;

        return -1;
    },

    getPendantLevel(pendantName) {
        if (this.isPendant(pendantName))
            return this.Data[pendantName].pendantLevel;

        return -1;
    },

    getRingLevel(ringName) {
        if (this.isRing(ringName)) return this.Data[ringName].ringLevel;

        return -1;
    },

    getBootsLevel(bootsName) {
        if (this.isBoots(bootsName)) return this.Data[bootsName].bootsLevel;

        return -1;
    },

    isArcherWeapon(string) {
        if (string in this.Data)
            return this.Data[string].type === 'weaponarcher';

        return false;
    },

    isWeapon(string) {
        if (string in this.Data)
            return (
                this.Data[string].type === 'weapon' ||
                this.Data[string].type === 'weaponarcher'
            );

        return false;
    },

    isArmour(string) {
        if (string in this.Data)
            return (
                this.Data[string].type === 'armor' ||
                this.Data[string].type === 'armorarcher'
            );

        return false;
    },

    isPendant(string) {
        if (string in this.Data) return this.Data[string].type === 'pendant';

        return false;
    },

    isRing(string) {
        if (string in this.Data) return this.Data[string].type === 'ring';

        return false;
    },

    isBoots(string) {
        if (string in this.Data) return this.Data[string].type === 'boots';

        return false;
    },

    getType(id) {
        if (id in this.Ids) return this.Ids[id].type;

        return null;
    },

    isStackable(id) {
        if (id in this.Ids) return this.Ids[id].stackable;

        return false;
    },

    isEdible(id) {
        if (id in this.Ids) return this.Ids[id].edible;

        return false;
    },

    getCustomData(id) {
        if (id in this.Ids) return this.Ids[id].customData;

        return null;
    },

    maxStackSize(id) {
        if (id in this.Ids) return this.Ids[id].maxStackSize;

        return false;
    },

    isShard(id) {
        return (
            id === 253 || id === 254 || id === 255 || id === 256 || id === 257
        );
    },

    isEnchantable(id) {
        return this.getType(id) !== 'object' && this.getType(id) !== 'craft';
    },

    getShardTier(id) {
        if (id === 253) return 1;
        else if (id === 254) return 2;
        else if (id === 255) return 3;
        else if (id === 256) return 4;
        else if (id === 257) return 5;
    },

    isEquippable(string) {
        return (
            this.isArmour(string) ||
            this.isWeapon(string) ||
            this.isPendant(string) ||
            this.isRing(string) ||
            this.isBoots(string)
        );
    },

    healsHealth(id) {
        if (id in this.Ids) return this.Ids[id].healsHealth > 0;

        return false;
    },

    getMovementSpeed(string) {
        if (string in this.Data) return this.Data[string].movementSpeed;

        return null;
    },

    healsMana(id) {
        if (id in this.Ids) return this.Ids[id].healsMana > 0;
    },

    getHealingFactor(id) {
        if (id in this.Ids) return this.Ids[id].healsHealth;

        return 0;
    },

    getManaFactor(id) {
        if (id in this.Ids) return this.Ids[id].healsMana;
        return 0;
    },
};
