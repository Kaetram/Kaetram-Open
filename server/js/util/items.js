/* global module */

let Items = {};

Items.Data = {};
Items.Ids = {};
Items.onCreate = {};

Items.Plugins = {};

Items.getData = (name) => {
    if (name in Items.Data)
        return Items.Data[name];

    return 'null';
};

Items.hasPlugin = (id) => {
    if (id in Items.Plugins)
      return true;

    return false;
};

Items.getPlugin = (id) => {
    if (Items.hasPlugin(id))
      return Items.Plugins[id];

    return null;
};

Items.idToString = (id) => {
    if (id in Items.Ids)
        return Items.Ids[id].key;

    return 'null';
};

Items.idToName = (id) => {
    if (id in Items.Ids)
        return Items.Ids[id].name;

    return 'null';
};

Items.stringToId = (name) => {

    if (name in Items.Data)
        return Items.Data[name].id;
    else
        log.error('Item: ' + name + ' not found in the database.');

    return 'null';
};

Items.getLevelRequirement = (name) => {
    let level = 0;

    if (!name)
        return level;

    let item = Items.Data[name];

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

Items.getWeaponLevel = (weaponName) => {
    if (Items.isWeapon(weaponName))
        return Items.Data[weaponName].attack;

    return -1;
};

Items.getArmourLevel = (armourName) => {
    if (Items.isArmour(armourName))
        return Items.Data[armourName].defense;

    return -1;
};

Items.getPendantLevel = (pendantName) => {
    if (Items.isPendant(pendantName))
        return Items.Data[pendantName].pendantLevel;

    return -1;
};

Items.getRingLevel = (ringName) => {
    if (Items.isRing(ringName))
        return Items.Data[ringName].ringLevel;

    return -1;
};

Items.getBootsLevel = (bootsName) => {
    if (Items.isBoots(bootsName))
        return Items.Data[bootsName].bootsLevel;

    return -1;
};

Items.isArcherWeapon = (string) => {
    if (string in Items.Data)
        return Items.Data[string].type === 'weaponarcher';

    return false;
};

Items.isWeapon = (string) => {
    if (string in Items.Data)
        return Items.Data[string].type === 'weapon' || Items.Data[string].type === 'weaponarcher';

    return false;
};

Items.isArmour = (string) => {
    if (string in Items.Data)
        return Items.Data[string].type === 'armor' || Items.Data[string].type === 'armorarcher';

    return false;
};

Items.isPendant = (string) => {
    if (string in Items.Data)
        return Items.Data[string].type === 'pendant';

    return false;
};

Items.isRing = (string) => {
    if (string in Items.Data)
        return Items.Data[string].type === 'ring';

    return false;
};

Items.isBoots = (string) => {
    if (string in Items.Data)
        return Items.Data[string].type === 'boots';

    return false;
};

Items.getType = (id) => {
    if (id in Items.Ids)
        return Items.Ids[id].type;

    return null;
};

Items.isStackable = (id) => {
    if (id in Items.Ids)
        return Items.Ids[id].stackable;

    return false;
};

Items.isEdible = (id) => {
    if (id in Items.Ids)
        return Items.Ids[id].edible;

    return false;
};

Items.getCustomData = (id) => {
    if (id in Items.Ids)
        return Items.Ids[id].customData;

    return null;
};

Items.maxStackSize = (id) => {
    if (id in Items.Ids)
        return Items.Ids[id].maxStackSize;

    return false;
};


Items.isShard = (id) => {
    return id === 253 || id === 254 || id === 255 || id === 256 || id === 257;
};

Items.isEnchantable = (id) => {
    return Items.getType(id) !== 'object' && Items.getType(id) !== 'craft';
};

Items.getShardTier = (id) => {
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

Items.isEquippable = (string) => {
    return Items.isArmour(string) || Items.isWeapon(string) || Items.isPendant(string) || Items.isRing(string) || Items.isBoots(string);
};

Items.healsHealth = (id) => {
    if (id in Items.Ids)
        return Items.Ids[id].healsHealth > 0;

    return false;
};

Items.getMovementSpeed = (string) => {
    if (string in Items.Data)
        return Items.Data[string].movementSpeed;

    return null;
};

Items.healsMana = (id) => {
    if (id in Items.Ids)
        return Items.Ids[id].healsMana > 0;
};

Items.getHealingFactor = (id) => {
    if (id in Items.Ids)
        return Items.Ids[id].healsHealth;

    return 0;
};

Items.getManaFactor = (id) => {
    if (id in Items.Ids)
        return Items.Ids[id].healsMana;
    return 0;
};

module.exports = Items;
