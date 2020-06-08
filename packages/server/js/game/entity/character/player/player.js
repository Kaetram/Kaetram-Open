/* global module */

let _ = require('underscore'),
    Character = require('../character'),
    Incoming = require('../../../../controllers/incoming'),
    Armour = require('./equipment/armour'),
    Weapon = require('./equipment/weapon'),
    Pendant = require('./equipment/pendant'),
    Ring = require('./equipment/ring'),
    Boots = require('./equipment/boots'),
    Items = require('../../../../util/items'),
    Messages = require('../../../../network/messages'),
    Formulas = require('../../../../util/formulas'),
    HitPoints = require('./points/hitpoints'),
    Mana = require('./points/mana'),
    Packets = require('../../../../network/packets'),
    Modules = require('../../../../util/modules'),
    Handler = require('./handler'),
    Quests = require('../../../../controllers/quests'),
    Inventory = require('./containers/inventory/inventory'),
    Abilities = require('./abilities/abilities'),
    Professions = require('./professions/professions'),
    Bank = require('./containers/bank/bank'),
    Enchant = require('./enchant'),
    Utils = require('../../../../util/utils'),
    Constants = require('../../../../util/constants'),
    Hit = require('../combat/hit'),
    Trade = require('./trade'),
    Warp = require('./warp'),
    Doors = require('./doors'),
    Friends = require('./friends');

class Player extends Character {

    constructor(world, database, connection, clientId) {
        super(-1, 'player', connection.id, -1, -1);


        this.world = world;
        this.database = database;
        this.connection = connection;

        this.clientId = clientId;

        this.map = world.map;
        this.regions = world.map.regions;
        this.globalObjects = world.globalObjects;

        this.incoming = new Incoming(this);

        this.ready = false;

        this.moving = false;
        this.potentialPosition = null;
        this.futurePosition = null;

        this.regionPosition = null;
        this.newRegion = false;

        this.team = null;
        this.userAgent = null;
		this.minigame = null;

        this.disconnectTimeout = null;
        this.timeoutDuration = 1000 * 60 * 10; //10 minutes
        this.lastRegionChange = new Date().getTime();

        this.handler = new Handler(this);

        this.inventory = new Inventory(this, 20);
        this.professions = new Professions(this);
        this.abilities = new Abilities(this);
        this.friends = new Friends(this);
        this.enchant = new Enchant(this);
        this.bank = new Bank(this, 56);
        this.quests = new Quests(this);
        this.trade = new Trade(this);
        this.doors = new Doors(this);
        this.warp = new Warp(this);

        this.introduced = false;
        this.currentSong = null;
        this.acceptedTrade = false;
        this.invincible = false;
        this.noDamage = false;
        this.isGuest = false;

        this.pvp = false;

        this.canTalk = true;

        this.instanced = false;
        this.visible = true;

        this.talkIndex = 0;
        this.cheatScore = 0;
        this.defaultMovementSpeed = 250; // For fallback.

        this.regionsLoaded = [];
        this.lightsLoaded = [];

        this.npcTalk = null;
    }

    load(data) {

        this.kind = data.kind;
        this.rights = data.rights;
        this.experience = data.experience;
        this.ban = data.ban;
        this.mute = data.mute;
        this.membership = data.membership;
        this.lastLogin = data.lastLogin;
        this.pvpKills = data.pvpKills;
        this.pvpDeaths = data.pvpDeaths;
        this.orientation = data.orientation;
        this.mapVersion = data.mapVersion;

        this.warp.setLastWarp(data.lastWarp);

        this.level = Formulas.expToLevel(this.experience);
        this.nextExperience = Formulas.nextExp(this.experience);
        this.prevExperience = Formulas.prevExp(this.experience);
        this.hitPoints = new HitPoints(data.hitPoints, Formulas.getMaxHitPoints(this.level));
        this.mana = new Mana(data.mana, Formulas.getMaxMana(this.level));

        if (data.invisibleIds)
            this.invisiblesIds = data.invisibleIds.split(' ');

        this.userAgent = data.userAgent;

        let armour = data.armour,
            weapon = data.weapon,
            pendant = data.pendant,
            ring = data.ring,
            boots = data.boots;

        this.setPosition(data.x, data.y);
        this.setArmour(armour[0], armour[1], armour[2], armour[3]);
        this.setWeapon(weapon[0], weapon[1], weapon[2], weapon[3]);
        this.setPendant(pendant[0], pendant[1], pendant[2], pendant[3]);
        this.setRing(ring[0], ring[1], ring[2], ring[3]);
        this.setBoots(boots[0], boots[1], boots[2], boots[3]);
    }

    destroy() {

        clearTimeout(this.disconnectTimeout);

        this.disconnectTimeout = null;

        this.handler.destroy();

        this.handler = null;
        this.inventory = null;
        this.abilities = null;
        this.enchant = null;
        this.bank = null;
        this.quests = null;
        this.trade = null;
        this.doors = null;
        this.warp = null;

        this.connection = null;
    }

    loadRegions(regions) {

        if (!regions)
            return;

        if (this.mapVersion !== this.map.version) {
            this.mapVersion = this.map.version;

            this.save();

            if (config.debug)
                log.info(`Updated map version for ${this.username}`);

            return;
        }

        if (regions.gameVersion === config.gver)
            this.regionsLoaded = regions.regions.split(',');
    }

    loadProfessions() {

        if (config.offlineMode)
            return;

        this.database.loader.getProfessions(this, (info) => {
            if (!info) // If this somehow happens.
                return;

            this.professions.update(info);

            this.sendProfessions();
        });
    }

    loadFriends() {

        if (config.offlineMode)
            return;

        this.database.loader.getFriends(this, (info) => {
            if (!info)
                return;

            this.friends.update(info);

        });
    }

    loadInventory() {

        if (config.offlineMode) {
            this.inventory.loadEmpty();
            return;
        }

        this.database.loader.getInventory(this, (ids, counts, skills, skillLevels) => {
            if (ids === null || counts === null) {
                this.inventory.loadEmpty();
                return;
            }

            if (ids.length !== this.inventory.size)
                this.save();

            this.inventory.load(ids, counts, skills, skillLevels);
            this.inventory.check();
        });
    }

    loadBank() {

        if (config.offlineMode) {
            this.bank.loadEmpty();
            return;
        }

        this.database.loader.getBank(this, (ids, counts, skills, skillLevels) => {
            if (ids === null || counts === null) {
                this.bank.loadEmpty();
                return;
            }

            if (ids.length !== this.bank.size)
                this.save();

            this.bank.load(ids, counts, skills, skillLevels);
            this.bank.check();
        });
    }

    loadQuests() {

        if (config.offlineMode)
            return;

        this.database.loader.getAchievements(this, (ids, progress) => {
            ids.pop();
            progress.pop();

            if (this.quests.getAchievementSize() !== ids.length) {
                log.info('Mismatch in achievements data.');

                this.save();
            }

            this.quests.updateAchievements(ids, progress);
        });

        this.database.loader.getQuests(this, (ids, stages) => {
            if (!ids || !stages) {
                this.quests.updateQuests(ids, stages);
                return;
            }

            /* Removes the empty space created by the loader */

            ids.pop();
            stages.pop();

            if (this.quests.getQuestSize() !== ids.length) {
                log.info('Mismatch in quest data.');

                this.save();
            }

            this.quests.updateQuests(ids, stages);
        });

        this.quests.onAchievementsReady(() => {

            this.send(new Messages.Quest(Packets.QuestOpcode.AchievementBatch, this.quests.getAchievementData()));

            /* Update region here because we receive quest info */
            if (this.questsLoaded)
                this.updateRegion();

            this.achievementsLoaded = true;
        });

        this.quests.onQuestsReady(() => {

            this.send(new Messages.Quest(Packets.QuestOpcode.QuestBatch, this.quests.getQuestData()));

            /* Update region here because we receive quest info */
            if (this.achievementsLoaded)
                this.updateRegion();

            this.questsLoaded = true;
        });

    }

    intro() {

        if (this.ban > new Date()) {
            this.connection.sendUTF8('ban');
            this.connection.close('Player: ' + this.username + ' is banned.');
        }

        if (this.x <= 0 || this.y <= 0)
            this.sendToSpawn();

        if (this.hitPoints.getHitPoints() < 0)
            this.hitPoints.setHitPoints(this.getMaxHitPoints());

        if (this.mana.getMana() < 0)
            this.mana.setMana(this.mana.getMaxMana());

        this.verifyRights();

        let info = {
            instance: this.instance,
            username: Utils.formatUsername(this.username),
            x: this.x,
            y: this.y,
            kind: this.kind,
            rights: this.rights,
            hitPoints: this.hitPoints.getData(),
            mana: this.mana.getData(),
            experience: this.experience,
            nextExperience: this.nextExperience,
            prevExperience: this.prevExperience,
            level: this.level,
            lastLogin: this.lastLogin,
            pvpKills: this.pvpKills,
            pvpDeaths: this.pvpDeaths,
            orientation: this.orientation,
            movementSpeed: this.getMovementSpeed()
        };

        this.regionPosition = [this.x, this.y];

        /**
         * Send player data to client here
         */

        this.world.addPlayer(this);

        this.send(new Messages.Welcome(info));
    }

    verifyRights() {

        if (config.moderators.indexOf(this.username.toLowerCase()) > -1)
            this.rights = 1;

        if (config.administrators.indexOf(this.username.toLowerCase()) > -1 ||
            config.offlineMode)
            this.rights = 2;

    }

    addExperience(exp) {

        this.experience += exp;

        let oldLevel = this.level;

        this.level = Formulas.expToLevel(this.experience);
        this.nextExperience = Formulas.nextExp(this.experience);
        this.prevExperience = Formulas.prevExp(this.experience);

        if (oldLevel !== this.level) {
            this.hitPoints.setMaxHitPoints(Formulas.getMaxHitPoints(this.level));
            this.healHitPoints(this.hitPoints.maxPoints);

            this.updateRegion();

            this.popup('Level Up!', `Congratulations, you are now level ${this.level}!`, '#ff6600');
        }

        let data = {
            id: this.instance,
            level: this.level
        };

        /**
         * Sending two sets of data as other users do not need to
         * know the experience of another player.. (yet).
         */

        this.sendToAdjacentRegions(this.region, new Messages.Experience(Packets.ExperienceOpcode.Combat, data), this.instance);

        data.amount = exp;
        data.experience = this.experience;
        data.nextExperience = this.nextExperience;
        data.prevExperience = this.prevExperience;

        this.send(new Messages.Experience(Packets.ExperienceOpcode.Combat, data));

        this.sync();
    }

    heal(amount) {

        /**
         * Passed from the superclass...
         */

        if (!this.hitPoints || !this.mana)
            return;

        this.hitPoints.heal(amount);
        this.mana.heal(amount);

        this.sync();
    }

    healHitPoints(amount) {
        let type = 'health';

        this.hitPoints.heal(amount);

        this.sync();

        this.sendToAdjacentRegions(this.region, new Messages.Heal({
            id: this.instance,
            type: type,
            amount: amount
        }));
    }

    healManaPoints(amount) {
        let type = 'mana';

        this.mana.heal(amount);

        this.sync();

        this.sendToAdjacentRegions(this.region, new Messages.Heal({
            id: this.instance,
            type: type,
            amount: amount
        }));
    }

    eat(id) {
        let item = Items.getPlugin(id);

        if (!item)
            return;

        new (item)(id).onUse(this);
    }

    equip(string, count, ability, abilityLevel) {
        let data = Items.getData(string),
            type, id, power;

        if (!data || data === 'null')
            return;

        log.debug(`Equipping item - ${[string, count, ability, abilityLevel]}`);

        if (Items.isArmour(string))
            type = Modules.Equipment.Armour;
        else if (Items.isWeapon(string))
            type = Modules.Equipment.Weapon;
        else if (Items.isPendant(string))
            type = Modules.Equipment.Pendant;
        else if (Items.isRing(string))
            type = Modules.Equipment.Ring;
        else if (Items.isBoots(string))
            type = Modules.Equipment.Boots;

        id = Items.stringToId(string);
        power = Items.getLevelRequirement(string);

        switch (type) {
            case Modules.Equipment.Armour:

                if (this.hasArmour() && this.armour.id !== 114)
                    this.inventory.add(this.armour.getItem());

                this.setArmour(id, count, ability, abilityLevel, power);
                break;

            case Modules.Equipment.Weapon:

                if (this.hasWeapon())
                    this.inventory.add(this.weapon.getItem());

                this.setWeapon(id, count, ability, abilityLevel, power);
                break;

            case Modules.Equipment.Pendant:

                if (this.hasPendant())
                    this.inventory.add(this.pendant.getItem());

                this.setPendant(id, count, ability, abilityLevel, power);
                break;

            case Modules.Equipment.Ring:

                if (this.hasRing())
                    this.inventory.add(this.ring.getItem());

                this.setRing(id, count, ability, abilityLevel, power);
                break;

            case Modules.Equipment.Boots:

                if (this.hasBoots())
                    this.inventory.add(this.boots.getItem());

                this.setBoots(id, count, ability, abilityLevel, power);
                break;
        }

        this.send(new Messages.Equipment(Packets.EquipmentOpcode.Equip, {
            type: type,
            name: Items.idToName(id),
            string: string,
            count: count,
            ability: ability,
            abilityLevel: abilityLevel,
            power: power
        }));
    }

    updateRegion(force) {
        this.world.region.sendRegion(this, this.region, force);
    }

    isInvisible(instance) {
        let entity = this.world.getEntityByInstance(instance);

        if (!entity)
            return false;

        return super.hasInvisibleId(entity.id) || super.hasInvisible(entity);
    }

    formatInvisibles() {
        return this.invisiblesIds.join(" ");
    }

    canEquip(string) {
        let requirement = Items.getLevelRequirement(string);

        if (requirement > Constants.MAX_LEVEL)
            requirement = Constants.MAX_LEVEL;

        if (requirement > this.level) {
            this.notify('You must be at least level ' + requirement + ' to equip this.');
            return false;
        }

        return true;
    }

    die() {
        this.dead = true;

        if (this.deathCallback)
            this.deathCallback();

        this.send(new Messages.Death(this.instance));
    }

    teleport(x, y, isDoor, animate) {

        if (this.teleportCallback)
            this.teleportCallback(x, y, isDoor);

        this.sendToAdjacentRegions(this.region, new Messages.Teleport({
            id: this.instance,
            x: x,
            y: y,
            withAnimation: animate
        }));

        this.setPosition(x, y);
        this.world.cleanCombat(this);
    }

    /**
     * We route all object clicks through the player instance
     * in order to organize data more neatly.
     */

    handleObject(id) {
        let info = this.globalObjects.getInfo(id);

        if (!info)
            return;

        let data;

        switch (info.type) {
            case 'sign':

                data = this.globalObjects.getSignData(id);

                if (!data)
                    return;

                let message = this.globalObjects.talk(data.object, this);

                this.world.push(Packets.PushOpcode.Player, {
                    player: this,
                    message: new Messages.Bubble({
                        id: id,
                        text: message,
                        duration: 5000,
                        isObject: true,
                        info: data.info
                    })
                });

                break;

            case 'lumberjacking':

                let lumberjacking = this.professions.getProfession(Modules.Professions.Lumberjacking);

                if (lumberjacking)
                    lumberjacking.handle(id, info.tree);

                break;
        }

    }

    incrementCheatScore(amount) {

        if (this.combat.started)
            return;

        this.cheatScore += amount;

        if (this.cheatScoreCallback)
            this.cheatScoreCallback();
    }

    updatePVP(pvp, permanent) {

        /**
         * No need to update if the state is the same
         */

        if (!this.region)
            return;

        if (this.pvp === pvp || this.permanentPVP)
            return;

        if (this.pvp && !pvp)
            this.notify('You are no longer in a PvP zone!');
        else
            this.notify('You have entered a PvP zone!');

        this.pvp = pvp;
        this.permanentPVP = permanent;

        this.sendToAdjacentRegions(this.region, new Messages.PVP(this.instance, this.pvp));
    }

    updateOverlay(overlay) {

        if (this.overlayArea === overlay)
            return;

        this.overlayArea = overlay;

        if (overlay && overlay.id) {
            this.lightsLoaded = [];

            this.send(new Messages.Overlay(Packets.OverlayOpcode.Set, {
                image: overlay.fog ? overlay.fog : 'empty',
                colour: 'rgba(0,0,0,' + overlay.darkness + ')'
            }));
        } else
            this.send(new Messages.Overlay(Packets.OverlayOpcode.Remove));
    }

    updateCamera(camera) {

        if (this.cameraArea === camera)
            return;

        this.cameraArea = camera;

        if (camera) {
            switch (camera.type) {
                case 'lockX':
                    this.send(new Messages.Camera(Packets.CameraOpcode.LockX));
                    break;

                case 'lockY':
                    this.send(new Messages.Camera(Packets.CameraOpcode.LockY));
                    break;

                case 'player':
                    this.send(new Messages.Camera(Packets.CameraOpcode.Player));
                    break;
            }

        } else
            this.send(new Messages.Camera(Packets.CameraOpcode.FreeFlow));
    }

    updateMusic(song) {

        this.currentSong = song;

        this.send(new Messages.Audio(song));
    }

    revertPoints() {

        this.hitPoints.setHitPoints(this.hitPoints.getMaxHitPoints());
        this.mana.setMana(this.mana.getMaxMana());

        this.sync();
    }

    applyDamage(damage) {
        this.hitPoints.decrement(damage);
    }

    toggleProfile(state) {

        this.profileDialogOpen = state;

        if (this.profileToggleCallback)
            this.profileToggleCallback(state);
    }

    toggleInventory(state) {

        this.inventoryOpen = state;

        if (this.inventoryToggleCallback)
            this.inventoryToggleCallback(state);
    }

    toggleWarp(state) {

        this.warpOpen = state;

        if (this.warpToggleCallback)
            this.warpToggleCallback(state);
    }

    getMana() {
        return this.mana.getMana();
    }

    getMaxMana() {
        return this.mana.getMaxMana();
    }

    getHitPoints() {
        return this.hitPoints.getHitPoints();
    }

    getMaxHitPoints() {
        return this.hitPoints.getMaxHitPoints();
    }

    getTutorial() {
        return this.quests.getQuest(Modules.Quests.Introduction);
    }

    getLumberjackingLevel() {
        return this.professions.getProfession(Modules.Professions.Lumberjacking).getLevel();
    }

    getWeaponLumberjackingLevel() {

        if (!this.hasLumberjackingWeapon())
            return -1;

        return this.weapon.lumberjacking;
    }

    getWeaponMiningLevel() {

        if (!this.hasMiningWeapon())
            return -1;

        return this.weapon.mining;
    }

    // We get dynamic trees surrounding the player
    getSurroundingTrees() {
        let tiles = {
                indexes: [],
                data: [],
                collisions: [],
                objectData: {}
            };

        _.each(this.map.treeIndexes, (index) => {
            let position = this.map.indexToGridPosition(index + 1),
                treeRegion = this.regions.regionIdFromPosition(position.x, position.y);

            if (!this.regions.isSurrounding(this.region, treeRegion))
                return;

            let objectId = this.map.getPositionObject(position.x, position.y),
                cursor = this.map.getCursor(index, objectId);

            tiles.indexes.push(index);
            tiles.data.push(this.map.clientMap.data[index]);
            tiles.collisions.push(this.map.collisions.indexOf(index) > -1);

            if (objectId)
                tiles.objectData[index] = {
                    isObject: !!objectId,
                    cursor: cursor
                };

        });

        return tiles;
    }

    getMovementSpeed() {
        let itemMovementSpeed = Items.getMovementSpeed(this.armour.name),
            movementSpeed = itemMovementSpeed || this.defaultMovementSpeed;

        /*
         * Here we can handle equipment/potions/abilities that alter
         * the player's movement speed. We then just broadcast it.
         */

        this.movementSpeed = movementSpeed;

        return this.movementSpeed;
    }

    /**
     * Setters
     */

    setArmour(id, count, ability, abilityLevel) {

        if (!id)
            return;

        this.armour = new Armour(Items.idToString(id), id, count, ability, abilityLevel);
    }

    breakWeapon() {

        this.notify('Your weapon has been broken.');

        this.setWeapon(-1, 0, 0, 0);

        this.sendEquipment();
    }

    setWeapon(id, count, ability, abilityLevel) {

        if (!id)
            return;

        this.weapon = new Weapon(Items.idToString(id), id, count, ability, abilityLevel);

        if (this.weapon.ranged)
            this.attackRange = 7;
    }

    setPendant(id, count, ability, abilityLevel) {

        if (!id)
            return;

        this.pendant = new Pendant(Items.idToString(id), id, count, ability, abilityLevel);
    }

    setRing(id, count, ability, abilityLevel) {

        if (!id)
            return;

        this.ring = new Ring(Items.idToString(id), id, count, ability, abilityLevel);
    }

    setBoots(id, count, ability, abilityLevel) {

        if (!id)
            return;

        this.boots = new Boots(Items.idToString(id), id, count, ability, abilityLevel);
    }

    guessPosition(x, y) {
        this.potentialPosition = {
            x: x,
            y: y
        }
    }

    setPosition(x, y) {

        if (this.dead)
            return;

        if (this.map.isOutOfBounds(x, y)) {
            x = 50;
            y = 89;
        }

        super.setPosition(x, y);

        this.sendToAdjacentRegions(this.region, new Messages.Movement(Packets.MovementOpcode.Move, {
            id: this.instance,
            x: x,
            y: y,
            forced: false,
            teleport: false
        }), this.instance);
    }

    setOrientation(orientation) {

        this.orientation = orientation;

        if (this.orientationCallback) // Will be necessary in the future.
            this.orientationCallback;
    }

    setFuturePosition(x, y) {
        /**
         * Most likely will be used for anti-cheating methods
         * of calculating the actual time and duration for the
         * displacement.
         */

        this.futurePosition = {
            x: x,
            y: y
        }
    }

    loadRegion(regionId) {
        this.regionsLoaded.push(regionId);
    }

    hasLoadedRegion(region) {
        return this.regionsLoaded.indexOf(region) > -1;
    }

    hasLoadedLight(light) {
        return this.lightsLoaded.indexOf(light) > -1;
    }

    timeout() {

        if (!this.connection)
            return;

        this.connection.sendUTF8('timeout');
        this.connection.close('Player timed out.');
    }

    refreshTimeout() {

        clearTimeout(this.disconnectTimeout);

        this.disconnectTimeout = setTimeout(() => {

            this.timeout();

        }, this.timeoutDuration);
    }

    /**
     * Getters
     */

    hasArmour() {
        return this.armour && this.armour.name !== 'null' && this.armour.id !== -1;
    }

    hasWeapon() {
        return this.weapon && this.weapon.name !== 'null' && this.weapon.id !== -1;
    }

    hasLumberjackingWeapon() {
        return this.weapon && this.weapon.lumberjacking > 0;
    }

    hasMiningWeapon() {
        return this.weapon && this.weapon.mining > 0;
    }

    hasBreakableWeapon() {
        return this.weapon && this.weapon.breakable;
    }

    hasPendant() {
        return this.pendant && this.pendant.name !== 'null' && this.pendant.id !== -1;
    }

    hasRing() {
        return this.ring && this.ring.name !== 'null' && this.ring.id !== -1;
    }

    hasBoots() {
        return this.boots && this.boots.name !== 'null' && this.boots.id !== -1;
    }

    hasMaxHitPoints() {
        return this.getHitPoints() >= this.hitPoints.getMaxHitPoints();
    }

    hasMaxMana() {
        return this.mana.getMana() >= this.mana.getMaxMana();
    }

    hasSpecialAttack() {
        return this.weapon && (this.weapon.hasCritical() || this.weapon.hasExplosive() || this.weapon.hasStun());
    }

    canBeStunned() {
        return true;
    }

    getState() {

        return {
            type: this.type,
            id: this.instance,
            name: Utils.formatUsername(this.username),
            x: this.x,
            y: this.y,
            rights: this.rights,
            level: this.level,
            pvp: this.pvp,
            pvpKills: this.pvpKills,
            pvpDeaths: this.pvpDeaths,
            attackRange: this.attackRange,
            orientation: this.orientation,
            hitPoints: this.hitPoints.getData(),
            movementSpeed: this.getMovementSpeed(),
            mana: this.mana.getData(),
            armour: this.armour.getData(),
            weapon: this.weapon.getData(),
            pendant: this.pendant.getData(),
            ring: this.ring.getData(),
            boots: this.boots.getData()
        };
    }

    getRemoteAddress() {
        return this.connection.socket.conn.remoteAddress;
    }

    getSpawn() {
        let position;

        /**
         * Here we will implement functions from quests and
         * other special events and determine a spawn point.
         */

        if (!this.finishedTutorial())
            return this.getTutorial().getSpawn();

        return { x: 325, y: 87 };
    }

    getHit(target) {

        let defaultDamage = Formulas.getDamage(this, target),
            isSpecial = 100 - this.weapon.abilityLevel < Utils.randomInt(0, 100);

        if (!this.hasSpecialAttack() || !isSpecial)
            return new Hit(Modules.Hits.Damage, defaultDamage);

        switch (this.weapon.ability) {

            case Modules.Enchantment.Critical:

                /**
                 * Still experimental, not sure how likely it is that you're
                 * gonna do a critical strike. I just do not want it getting
                 * out of hand, it's easier to buff than to nerf..
                 */

                let multiplier = 1.00 + this.weapon.abilityLevel,
                    damage = defaultDamage * multiplier;

                return new Hit(Modules.Hits.Critical, damage);

            case Modules.Enchantment.Stun:
                return new Hit(Modules.Hits.Stun, defaultDamage);

            case Modules.Enchantment.Explosive:
                return new Hit(Modules.Hits.Explosive, defaultDamage);

        }
    }

    isMuted() {
        let time = new Date().getTime();

        return this.mute - time > 0;
    }

    isRanged() {
        return this.weapon && this.weapon.isRanged();
    }

    isDead() {
        return this.getHitPoints() < 1 || this.dead;
    }

    /**
     * Miscellaneous
     */

    send(message) {
        this.world.push(Packets.PushOpcode.Player, {
            player: this,
            message: message
        });
    }

    sendToRegion(message) {
        this.world.push(Packets.PushOpcode.Region, {
            regionId: this.region,
            message: message
        });
    }

    sendToAdjacentRegions(regionId, message, ignoreId) {
        this.world.push(Packets.PushOpcode.Regions, {
            regionId: regionId,
            message: message,
            ignoreId: ignoreId
        });
    }

    sendEquipment() {
        let info = {
                armour: this.armour.getData(),
                weapon: this.weapon.getData(),
                pendant: this.pendant.getData(),
                ring: this.ring.getData(),
                boots: this.boots.getData()
            };

        this.send(new Messages.Equipment(Packets.EquipmentOpcode.Batch, info));
    }

    sendProfessions() {

        if (!this.professions)
            return;

        this.send(new Messages.Profession(Packets.ProfessionOpcode.Batch, {
            data: this.professions.getInfo()
        }));
    }

    sendToSpawn() {
        let position = this.getSpawn();

        this.x = position.x;
        this.y = position.y;
    }

    sendMessage(playerName, message) {

        if (config.hubEnabled) {
            this.world.api.sendPrivateMessage(this, playerName, message);
            return;
        }

        if (!this.world.isOnline(playerName)) {
            this.notify(`@aquamarine@${playerName}@crimson@ is not online.`, 'crimson');
            return;
        }

        let otherPlayer = this.world.getPlayerByName(playerName),
            oFormattedName = Utils.formatUsername(playerName), // Formated username of the other player.
            formattedName = Utils.formatUsername(this.username); // Formatted username of current instance.

        otherPlayer.notify(`[From ${oFormattedName}]: ${message}`, 'aquamarine');
        this.notify(`[To ${formattedName}]: ${message}`, 'aquamarine');
    }

    sync() {

        /**
         * Function to be used for syncing up health,
         * mana, exp, and other variables
         */

        if (!this.hitPoints || !this.mana)
            return;

        let info = {
            id: this.instance,
            attackRange: this.attackRange,
            hitPoints: this.getHitPoints(),
            maxHitPoints: this.getMaxHitPoints(),
            mana: this.mana.getMana(),
            maxMana: this.mana.getMaxMana(),
            level: this.level,
            armour: this.armour.getString(),
            weapon: this.weapon.getData(),
            poison: !!this.poison,
            movementSpeed: this.getMovementSpeed()
        };

        this.sendToAdjacentRegions(this.region, new Messages.Sync(info));

        this.save();
    }

    popup(title, message, colour) {

        if (!title)
            return;

        title = Utils.parseMessage(title);
        message = Utils.parseMessage(message);

        this.send(new Messages.Notification(Packets.NotificationOpcode.Popup, {
            title: title,
            message: message,
            colour: colour
        }));
    }

    notify(message, colour) {

        if (!message)
            return;

        // Prevent notify spams
        if (new Date().getTime() - this.lastNotify < 250)
            return;

        message = Utils.parseMessage(message);

        this.send(new Messages.Notification(Packets.NotificationOpcode.Text, {
            message: message,
            colour: colour
        }));

        this.lastNotify = new Date().getTime();
    }

    /**
     * Sends a chat packet that can be used to
     * show special messages to the player.
     */

    chat(source, text, colour, isGlobal, withBubble) {

        if (!source || !text)
            return;

        this.send(new Messages.Chat({
            name: source,
            text: text,
            colour: colour,
            isGlobal: isGlobal,
            withBubble: withBubble
        }))
    }

    stopMovement(force) {
        /**
         * Forcefully stopping the player will simply halt
         * them in between tiles. Should only be used if they are
         * being transported elsewhere.
         */


        this.send(new Messages.Movement(Packets.MovementOpcode.Stop, {
            instance: this.instance,
            force: force
        }));
    }

    finishedTutorial() {

        if (!this.quests || !config.tutorialEnabled)
            return true;

        return this.quests.getQuest(0).isFinished();
    }

    finishedAchievement(id) {

        if (!this.quests)
            return false;

        let achievement = this.quests.getAchievement(id);

        if (!achievement)
            return true;

        return achievement.isFinished();
    }

    finishAchievement(id) {

        if (!this.quests)
            return;

        let achievement = this.quests.getAchievement(id);

        if (!achievement || achievement.isFinished())
            return;

        achievement.finish();
    }

    checkRegions() {

        if (!this.regionPosition)
            return;

        let diffX = Math.abs(this.regionPosition[0] - this.x),
            diffY = Math.abs(this.regionPosition[1] - this.y);

        if (diffX >= 10 || diffY >= 10) {
            this.regionPosition = [this.x, this.y];

            if (this.regionCallback)
                this.regionCallback();
        }
    }

    movePlayer() {

        /**
         * Server-sided callbacks towards movement should
         * not be able to be overwritten. In the case that
         * this is used (for Quests most likely) the server must
         * check that no hacker removed the constraint in the client-side.
         * If they are not within the bounds, apply the according punishment.
         */

        this.send(new Messages.Movement(Packets.MovementOpcode.Started));
    }

    walkRandomly() {

        setInterval(() => {
            this.setPosition(this.x + Utils.randomInt(-5, 5), this.y + Utils.randomInt(-5, 5));
        }, 2000);

    }

    killCharacter(character) {

        if (this.killCallback)
            this.killCallback(character);
    }

    save() {

        if (config.offlineMode || this.isGuest)
            return;

        if ((!this.questsLoaded || !this.achievementsLoaded) && !this.new)
            return;

        this.database.creator.save(this);
    }

    inTutorial() {
        return this.world.map.inTutorialArea(this);
    }

    hasAggressionTimer() {
        return new Date().getTime() - this.lastRegionChange < 1200000; // 20 Minutes
    }

    onOrientation(callback) {
        this.orientationCallback = callback;
    }

    onRegion(callback) {
        this.regionCallback = callback;
    }

    onAttack(callback) {
        this.attackCallback = callback;
    }

    onHit(callback) {
        this.hitCallback = callback;
    }

    onKill(callback) {
        this.killCallback = callback;
    }

    onDeath(callback) {
        this.deathCallback = callback;
    }

    onTalkToNPC(callback) {
        this.npcTalkCallback = callback;
    }

    onDoor(callback) {
        this.doorCallback = callback;
    }

    onTeleport(callback) {
        this.teleportCallback = callback;
    }

    onProfile(callback) {
        this.profileToggleCallback = callback;
    }

    onInventory(callback) {
        this.inventoryToggleCallback = callback;
    }

    onWarp(callback) {
        this.warpToggleCallback = callback;
    }

    onCheatScore(callback) {
        this.cheatScoreCallback = callback;
    }

    onReady(callback) {
        this.readyCallback = callback;
    }

}

module.exports = Player;
