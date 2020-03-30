"use strict";
exports.__esModule = true;
exports["default"] = {
    Data: {},
    Ids: {},
    onCreate: {},
    Plugins: {},
    getData: function (name) {
        if (name in this.Data)
            return this.Data[name];
        return 'null';
    },
    hasPlugin: function (id) {
        if (id in this.Plugins)
            return true;
        return false;
    },
    getPlugin: function (id) {
        if (this.hasPlugin(id))
            return this.Plugins[id];
        return null;
    },
    idToString: function (id) {
        if (id in this.Ids)
            return this.Ids[id].key;
        return 'null';
    },
    idToName: function (id) {
        if (id in this.Ids)
            return this.Ids[id].name;
        return 'null';
    },
    stringToId: function (name) {
        if (name in this.Data)
            return this.Data[name].id;
        console.error("Item: " + name + " not found in the database.");
        return 'null';
    },
    getLevelRequirement: function (name) {
        var level = 1;
        var item = this.Data[name];
        if (item && item.requirement)
            return item.requirement;
        if (this.isWeapon(name))
            level = this.Data[name].attack;
        else if (this.isArmour(name))
            level = this.Data[name].defense;
        else if (this.isPendant(name))
            level = this.Data[name].pendantLevel;
        else if (this.isRing(name))
            level = this.Data[name].ringLevel;
        else if (this.isBoots(name))
            level = this.Data[name].bootsLevel;
        return level * 2;
    },
    getWeaponLevel: function (weaponName) {
        if (this.isWeapon(weaponName))
            return this.Data[weaponName].attack;
        return -1;
    },
    getArmourLevel: function (armourName) {
        if (this.isArmour(armourName))
            return this.Data[armourName].defense;
        return -1;
    },
    getPendantLevel: function (pendantName) {
        if (this.isPendant(pendantName))
            return this.Data[pendantName].pendantLevel;
        return -1;
    },
    getRingLevel: function (ringName) {
        if (this.isRing(ringName))
            return this.Data[ringName].ringLevel;
        return -1;
    },
    getBootsLevel: function (bootsName) {
        if (this.isBoots(bootsName))
            return this.Data[bootsName].bootsLevel;
        return -1;
    },
    isArcherWeapon: function (string) {
        if (string in this.Data)
            return this.Data[string].type === 'weaponarcher';
        return false;
    },
    isWeapon: function (string) {
        if (string in this.Data)
            return (this.Data[string].type === 'weapon' ||
                this.Data[string].type === 'weaponarcher');
        return false;
    },
    isArmour: function (string) {
        if (string in this.Data)
            return (this.Data[string].type === 'armor' ||
                this.Data[string].type === 'armorarcher');
        return false;
    },
    isPendant: function (string) {
        if (string in this.Data)
            return this.Data[string].type === 'pendant';
        return false;
    },
    isRing: function (string) {
        if (string in this.Data)
            return this.Data[string].type === 'ring';
        return false;
    },
    isBoots: function (string) {
        if (string in this.Data)
            return this.Data[string].type === 'boots';
        return false;
    },
    getType: function (id) {
        if (id in this.Ids)
            return this.Ids[id].type;
        return null;
    },
    isStackable: function (id) {
        if (id in this.Ids)
            return this.Ids[id].stackable;
        return false;
    },
    isEdible: function (id) {
        if (id in this.Ids)
            return this.Ids[id].edible;
        return false;
    },
    getCustomData: function (id) {
        if (id in this.Ids)
            return this.Ids[id].customData;
        return null;
    },
    maxStackSize: function (id) {
        if (id in this.Ids)
            return this.Ids[id].maxStackSize;
        return false;
    },
    isShard: function (id) {
        return (id === 253 || id === 254 || id === 255 || id === 256 || id === 257);
    },
    isEnchantable: function (id) {
        return this.getType(id) !== 'object' && this.getType(id) !== 'craft';
    },
    getShardTier: function (id) {
        if (id === 253)
            return 1;
        if (id === 254)
            return 2;
        if (id === 255)
            return 3;
        if (id === 256)
            return 4;
        if (id === 257)
            return 5;
    },
    isEquippable: function (string) {
        return (this.isArmour(string) ||
            this.isWeapon(string) ||
            this.isPendant(string) ||
            this.isRing(string) ||
            this.isBoots(string));
    },
    healsHealth: function (id) {
        if (id in this.Ids)
            return this.Ids[id].healsHealth > 0;
        return false;
    },
    getMovementSpeed: function (string) {
        if (string in this.Data)
            return this.Data[string].movementSpeed;
        return null;
    },
    healsMana: function (id) {
        if (id in this.Ids)
            return this.Ids[id].healsMana > 0;
    },
    getHealingFactor: function (id) {
        if (id in this.Ids)
            return this.Ids[id].healsHealth;
        return 0;
    },
    getManaFactor: function (id) {
        if (id in this.Ids)
            return this.Ids[id].healsMana;
        return 0;
    }
};
