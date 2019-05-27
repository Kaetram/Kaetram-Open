/* global module */

let Items = {};

Items.Data = {};
Items.Ids = {};
Items.onCreate = {};

Items.Plugins = {};

Items.getData = function(name) {
    if (name in Items.Data)
        return Items.Data[name];

    return 'null';
};

Items.hasPlugin = function(id) {
    if(id in Items.Ids)
        if (Items.Ids[id].plugin in Items.Plugins)
            return true;

    return false;
};

Items.isNewPlugin = function(id) {
    if (id in Items.Ids)
        if (Items.Ids[id].plugin in Items.Plugins)
            return Items.Plugins[Items.Ids[id].plugin];
};

Items.idToString = function(id) {
    if (id in Items.Ids)
        return Items.Ids[id].key;

    return 'null';
};

Items.idToName = function(id) {
    if (id in Items.Ids)
        return Items.Ids[id].name;

    return 'null';
};

Items.stringToId = function(name) {

    if (name in Items.Data)
        return Items.Data[name].id;
    else
        log.error('Item: ' + name + ' not found in the database.');

    return 'null';
};

Items.getLevelRequirement = function(name) {
    var level = 1,
        item = Items.Data[name];

    if (item && item.requirement)
        return item.requirement;

    if (Items.isWeapon(name))
        level = Items.Data[name].attack;
    else if (Items.isArmour(name))
        level = Items.Data[name].defense;
    else if (Items.isPendant(name))
        level = Items.Data[name].pendantLevel;
    else if (Items.isRing(name))
        level = Items.Data[name].ringLevel;
    else if (Items.isBoots(name))
        level = Items.Data[name].bootsLevel;

    return level * 2;
};

Items.getWeaponLevel = function(weaponName) {
    if (Items.isWeapon(weaponName))
        return Items.Data[weaponName].attack;

    return -1;
};

Items.getArmourLevel = function(armourName) {
    if (Items.isArmour(armourName))
        return Items.Data[armourName].defense;

    return -1;
};

Items.getPendantLevel = function(pendantName) {
    if (Items.isPendant(pendantName))
        return Items.Data[pendantName].pendantLevel;

    return -1;
};

Items.getRingLevel = function(ringName) {
    if (Items.isRing(ringName))
        return Items.Data[ringName].ringLevel;

    return -1;
};

Items.getBootsLevel = function(bootsName) {
    if (Items.isBoots(bootsName))
        return Items.Data[bootsName].bootsLevel;

    return -1;
};

Items.isArcherWeapon = function(string) {
    if (string in Items.Data)
        return Items.Data[string].type === 'weaponarcher';

    return false;
};

Items.isWeapon = function(string) {
    if (string in Items.Data)
        return Items.Data[string].type === 'weapon' || Items.Data[string].type === 'weaponarcher';

    return false;
};

Items.isArmour = function(string) {
    if (string in Items.Data)
        return Items.Data[string].type === 'armor' || Items.Data[string].type === 'armorarcher';

    return false;
};

Items.isPendant = function(string) {
    if (string in Items.Data)
        return Items.Data[string].type === 'pendant';

    return false;
};

Items.isRing = function(string) {
    if (string in Items.Data)
        return Items.Data[string].type === 'ring';

    return false;
};

Items.isBoots = function(string) {
    if (string in Items.Data)
        return Items.Data[string].type === 'boots';

    return false;
};

Items.getType = function(id) {
    if (id in Items.Ids)
        return Items.Ids[id].type;

    return null;
};

Items.isStackable = function(id) {
    if (id in Items.Ids)
        return Items.Ids[id].stackable;

    return false;
};

Items.isEdible = function(id) {
    if (id in Items.Ids)
        return Items.Ids[id].edible;

    return false;
};

Items.getCustomData = function(id) {
    if (id in Items.Ids)
        return Items.Ids[id].customData;

    return null;
};

Items.maxStackSize = function(id) {
    if (id in Items.Ids)
        return Items.Ids[id].maxStackSize;

    return false;
};


Items.isShard = function(id) {
    return id === 253 || id === 254 || id === 255 || id === 256 || id === 257;
};

Items.isEnchantable = function(id) {
    return Items.getType(id) !== 'object' && Items.getType(id) !== 'craft';
};

Items.getShardTier = function(id) {
    if (id === 253)
        return 1;
    else if (id === 254)
        return 2;
    else if (id === 255)
        return 3;
    else if (id === 256)
        return 4;
    else if (id === 257)
        return 5;
};

Items.isEquippable = function(string) {
    return Items.isArmour(string) || Items.isWeapon(string) || Items.isPendant(string) || Items.isRing(string) || Items.isBoots(string);
};

Items.healsHealth = function(id) {
    if (id in Items.Ids)
        return Items.Ids[id].healsHealth > 0;

    return false;
};


Items.healsMana = function(id) {
    if (id in Items.Ids)
        return Items.Ids[id].healsMana > 0;
};

Items.getHealingFactor = function(id) {
    if (id in Items.Ids)
        return Items.Ids[id].healsHealth;

    return 0;
};

Items.getManaFactor = function(id) {
    if (id in Items.Ids)
        return Items.Ids[id].healsMana;
    return 0;
};

module.exports = Items;