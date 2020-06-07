/* global Modules, log, _ */

define(['../character', './equipment/armour', './equipment/weapon',
        './equipment/pendant', './equipment/boots', './equipment/ring'],
        function(Character, Armour, Weapon, Pendant, Boots, Ring) {

    return Character.extend({

        init: function() {
            var self = this;

            self._super(-1, Modules.Types.Player);

            self.username = '';
            self.password = '';
            self.email = '';

            self.avatar = null;

            self.rights = 0;
            self.wanted = false;
            self.experience = -1;
            self.nextExperience = -1;
            self.prevExperience = -1;
            self.level = -1;
            self.pvpKills = -1;
            self.pvpDeaths = -1;

            self.hitPoints = -1;
            self.maxHitPoints = -1;
            self.mana = -1;
            self.maxMana = -1;

            self.prevX = 0;
            self.prevY = 0;

            self.direction = null;
            self.pvp = false;

            self.moveLeft = false;
            self.moveRight = false;
            self.moveUp = false;
            self.moveDown = false;
            self.disableAction = false;

            self.loadEquipment();

        },

        load: function(data) {
            var self = this;

            self.setId(data.instance);
            self.setName(data.username);
            self.setGridPosition(data.x, data.y);
            self.setPointsData(data.hitPoints, data.mana);
            self.setExperience(data.experience, data.nextExperience, data.prevExperience);

            self.level = data.level;

            self.lastLogin = data.lastLogin;
            self.pvpKills = data.pvpKills;
            self.pvpDeaths = data.pvpDeaths;

            self.orientation = data.orienation;

            self.movementSpeed = data.movementSpeed;

            self.type = 'player';
        },

        loadHandler: function(game) {
            var self = this;

            /**
             * This is for other player characters
             */

            self.handler.setGame(game);
            self.handler.load();
        },

        hasKeyboardMovement: function() {
            return this.moveLeft || this.moveRight || this.moveUp || this.moveDown;
        },

        stop: function(force) {
            this._super(force);
        },

        setId: function(id) {
            this.id = id;
        },

        idle: function() {
            this._super();
        },

        loadEquipment: function() {
            var self = this;

            self.armour = null;
            self.weapon = null;
            self.pendant = null;
            self.ring = null;
            self.boots = null;
        },

        isRanged: function() {
            return this.weapon && this.weapon.ranged;
        },

        follow: function(character) {
            this._super(character);
        },

        go: function(x, y, forced) {
            this._super(x, y, forced);
        },

        hasWeapon: function() {
            return this.weapon ? this.weapon.exists() : false;
        },

        performAction: function(orientation, action) {
            this._super(orientation, action);
        },

        setName: function(name) {
            var self = this;

            self.username = name;
            self.name = name;
        },

        setSprite: function(sprite) {
            this._super(sprite);
        },

        getSpriteName: function() {
            return this.armour ? this.armour.string : 'clotharmor';
        },

        setGridPosition: function(x, y) {
            this._super(x, y);
        },

        setHitPoints: function(hitPoints) {
            this._super(hitPoints);
        },

        setMaxHitPoints: function(maxHitPoints) {
            this._super(maxHitPoints);
        },

        setMana: function(mana) {
            this.mana = mana;
        },

        setMaxMana: function(maxMana) {
            this.maxMana = maxMana;
        },

        setPoison: function(poison) {
            var self = this;

            if (self.poison === poison)
                return;

            self.poison = poison;

            if (self.poison)
                $('#health').css('background', '-webkit-linear-gradient(right, #079231, #012b0c)');
            else
                $('#health').css('background', '-webkit-linear-gradient(right, #ff0000, #ef5a5a)');
        },

        clearHealthBar: function() {
            this._super();
        },

        getX: function() {
            return this.gridX;
        },

        getY: function() {
            return this.gridY;
        },

        setExperience: function(experience, nextExperience, prevExperience) {
            var self = this;

            self.experience = experience;
            self.nextExperience = nextExperience;
            self.prevExperience = prevExperience || 0;

            if (self.experienceCallback)
                self.experienceCallback();
        },

        setPointsData: function(hitPointsData, manaData) {
            var self = this,
                hitPoints = hitPointsData.shift(),
                maxHitPoints = hitPointsData.shift(),
                mana = manaData.shift(),
                maxMana = manaData.shift();

            self.setMaxHitPoints(maxHitPoints);
            self.setMaxMana(maxMana);

            self.setHitPoints(hitPoints);
            self.setMana(mana);
        },

        setEquipment: function(type, name, string, count, ability, abilityLevel, power) {
            var self = this;

            switch (type) {
                case Modules.Equipment.Armour:

                    if (!self.armour)
                        self.armour = new Armour(name, string, count, ability, abilityLevel, power);
                    else
                        self.armour.update(name, string, count, ability, abilityLevel, power);

                    if (self.updateArmourCallback)
                        self.updateArmourCallback(string, power);

                    break;

                case Modules.Equipment.Weapon:

                    if (!self.weapon)
                        self.weapon = new Weapon(name, string, count, ability, abilityLevel, power);
                    else
                        self.weapon.update(name, string, count, ability, abilityLevel, power);

                    self.weapon.ranged = string.includes('bow');

                    if (self.updateWeaponCallback)
                        self.updateWeaponCallback(string, power);

                    break;

                case Modules.Equipment.Pendant:

                    if (!self.pendant)
                        self.pendant = new Pendant(name, string, count, ability, abilityLevel, power);
                    else
                        self.pendant.update(name, string, count, ability, abilityLevel, power);

                    break;

                case Modules.Equipment.Ring:

                    if (!self.ring)
                        self.ring = new Ring(name, string, count, ability, abilityLevel, power);
                    else
                        self.ring.update(name, string, count, ability, abilityLevel, power);

                    break;

                case Modules.Equipment.Boots:

                    if (!self.boots)
                        self.boots = new Boots(name, string, count, ability, abilityLevel, power);
                    else
                        self.boots.update(name, string, count, ability, abilityLevel, power);

                    break;

            }

            if (self.updateEquipmentCallback)
                self.updateEquipmentCallback(type, power);
        },

        unequip: function(type) {
            var self = this;

            switch (type) {
                case 'armour':
                    self.armour.update('Cloth Armour', 'clotharmor', 1, -1, -1);
                    break;

                case 'weapon':
                    self.weapon.update(null, null, -1, -1, -1);
                    break;

                case 'pendant':
                    self.pendant.update(null, null, -1, -1, -1);
                    break;

                case 'ring':
                    self.ring.update(null, null, -1, -1, -1);
                    break;

                case 'boots':
                    self.boots.update(null, null, -1, -1, -1);
                    break;
            }
        },

        tempBlink: function() {
            var self = this;

            self.blink(90);

            if (!self.tempBlinkTimeout)
                self.tempBlinkTimeout = setTimeout(function() { self.stopBlinking(); }, 500);
        },
        
        getDistance: function(entity) {
            return this._super(entity);
        },

        onUpdateArmour: function(callback) {
            this.updateArmourCallback = callback;
        },

        onUpdateWeapon: function(callback) {
            this.updateWeaponCallback = callback;
        },

        onUpdateEquipment: function(callback) {
            this.updateEquipmentCallback = callback;
        },

        onExperience: function(callback) {
            this.experienceCallback = callback;
        }

    });

});
