import config from '../../../../../config';
import Incoming from '../../../../controllers/incoming';
import Quests from '../../../../controllers/quests';
import MongoDB from '../../../../database/mongodb/mongodb';
import Connection from '../../../../network/connection';
import Messages from '../../../../network/messages';
import Packets from '../../../../network/packets';
import Constants from '../../../../util/constants';
import Formulas from '../../../../util/formulas';
import Items from '../../../../util/items';
import Modules from '../../../../util/modules';
import Utils from '../../../../util/utils';
import World from '../../../world';
import Character from '../character';
import Hit from '../combat/hit';
import Abilities from './ability/abilities';
import Bank from './containers/bank/bank';
import Inventory from './containers/inventory/inventory';
import Doors from './doors';
import Enchant from './enchant';
import Armour from './equipment/armour';
import Boots from './equipment/boots';
import Pendant from './equipment/pendant';
import Ring from './equipment/ring';
import Weapon from './equipment/weapon';
import Handler from './handler';
import HitPoints from './points/hitpoints';
import Mana from './points/mana';
import Trade from './trade';
import Warp from './warp';

/**
 *
 */
class Player extends Character {
    public region: any;

    public invisiblesIds: any;

    public hitPoints: any;

    public mana: any;

    public quests: any;

    public potentialPosition: any;

    public futurePosition: any;

    public regionsLoaded: any;

    public lightsLoaded: any;

    public armour: any;

    public weapon: any;

    public pendant: any;

    public ring: any;

    public boots: any;

    public dead: any;

    public lastRegionChange: any;

    public orientationCallback: any;

    public regionCallback: any;

    public attackCallback: any;

    public hitCallback: any;

    public killCallback: any;

    public deathCallback: any;

    public npcTalkCallback: any;

    public doorCallback: any;

    public teleportCallback: any;

    public profileToggleCallback: any;

    public inventoryToggleCallback: any;

    public warpToggleCallback: any;

    public cheatScoreCallback: any;

    public readyCallback: any;

    public kind: any;

    public rights: any;

    public experience: any;

    public ban: any;

    public mute: any;

    public membership: any;

    public lastLogin: any;

    public pvpKills: any;

    public pvpDeaths: any;

    public orientation: any;

    public mapVersion: any;

    public warp: any;

    public level: any;

    public nextExperience: any;

    public prevExperience: any;

    public userAgent: any;

    public username: any;

    public inventory: any;

    public bank: any;

    public achievementsLoaded: any;

    public questsLoaded: any;

    public x: any;

    public y: any;

    public instance: any;

    public regionPosition: any;

    public combat: any;

    public cheatScore: any;

    public pvp: any;

    public permanentPVP: any;

    public overlayArea: any;

    public cameraArea: any;

    public currentSong: any;

    public profileDialogOpen: any;

    public inventoryOpen: any;

    public warpOpen: any;

    public defaultMovementSpeed: any;

    public movementSpeed: any;

    public attackRange: any;

    public disconnectTimeout: any;

    public timeoutDuration: any;

    public type: any;

    public poison: any;

    public isGuest: any;

    public new: boolean;

    public incoming: Incoming;

    public ready: boolean;

    public moving: boolean;

    public newRegion: boolean;

    public team: any;

    public guild: any;

    public handler: Handler;

    public abilities: Abilities;

    public enchant: Enchant;

    public trade: Trade;

    public doors: Doors;

    public introduced: boolean;

    public acceptedTrade: boolean;

    public invincible: boolean;

    public noDamage: boolean;

    public canTalk: boolean;

    public instanced: boolean;

    public visible: boolean;

    public talkIndex: number;

    public npcTalk: any;

    public maxMana: any;

    public frozen: any;

    public lastMovement: number;

    public spawnLocation: any;

    /**
     * Creates an instance of Player.
     * @param world -
     * @param database -
     * @param connection -
     * @param clientId -
     */
    constructor(
        public world: World,
        public database: MongoDB,
        public connection: Connection,
        public clientId: string
    ) {
        super(-1, 'player', connection.id, -1, -1);

        this.world = world;
        this.database = database;
        this.connection = connection;

        this.clientId = clientId;

        this.incoming = new Incoming(this);

        this.ready = false;

        this.moving = false;
        this.potentialPosition = null;
        this.futurePosition = null;

        this.regionPosition = null;
        this.newRegion = false;

        this.team = null;
        this.userAgent = null;
        this.guild = null;

        this.disconnectTimeout = null;
        this.timeoutDuration = 1000 * 60 * 10; // 10 minutes
        this.lastRegionChange = new Date().getTime();

        this.handler = new Handler(this);

        this.inventory = new Inventory(this, 20);
        this.abilities = new Abilities(this);
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
        this.hitPoints = new HitPoints(
            data.hitPoints,
            Formulas.getMaxHitPoints(this.level)
        );
        this.mana = new Mana(data.mana, Formulas.getMaxMana(this.level));

        if (data.invisibleIds) {
            this.invisiblesIds = data.invisibleIds.split(' ');
        }

        this.userAgent = data.userAgent;

        const { armour } = data;
        const { weapon } = data;
        const { pendant } = data;
        const { ring } = data;
        const { boots } = data;

        this.setPosition(data.x, data.y);
        this.setArmour(armour[0], armour[1], armour[2], armour[3]);
        this.setWeapon(weapon[0], weapon[1], weapon[2], weapon[3]);
        this.setPendant(pendant[0], pendant[1], pendant[2], pendant[3]);
        this.setRing(ring[0], ring[1], ring[2], ring[3]);
        this.setBoots(boots[0], boots[1], boots[2], boots[3]);
    }

    loadRegions(regions) {
        if (!regions) return;

        if (this.mapVersion !== this.world.map.version) {
            this.mapVersion = this.world.map.version;

            this.save();

            if (config.debug) {
                console.info(`Updated map version for ${this.username}`);
            }

            return;
        }

        if (regions.gameVersion === config.gver) {
            this.regionsLoaded = regions.regions.split(',');
        }
    }

    loadInventory() {
        if (config.offlineMode) {
            this.inventory.loadEmpty();

            return;
        }

        this.database.loader.getInventory(
            this,
            (ids, counts, skills, skillLevels) => {
                if (ids === null && counts === null) {
                    this.inventory.loadEmpty();

                    return;
                }

                if (ids.length !== this.inventory.size) this.save();

                this.inventory.load(ids, counts, skills, skillLevels);
                this.inventory.check();

                this.loadBank();
            }
        );
    }

    loadBank() {
        if (config.offlineMode) {
            this.bank.loadEmpty();

            return;
        }

        this.database.loader.getBank(
            this,
            (ids, counts, skills, skillLevels) => {
                if (ids.length !== this.bank.size) this.save();

                this.bank.load(ids, counts, skills, skillLevels);
                this.bank.check();
            }
        );
    }

    loadQuests() {
        if (config.offlineMode) return;

        this.database.loader.getAchievements(this, (ids, progress) => {
            ids.pop();
            progress.pop();

            if (this.quests.getAchievementSize() !== ids.length) {
                console.info('Mismatch in achievements data.');

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
                console.info('Mismatch in quest data.');

                this.save();
            }

            this.quests.updateQuests(ids, stages);
        });

        this.quests.onAchievementsReady(() => {
            this.send(
                new Messages.Quest(
                    Packets.QuestOpcode.AchievementBatch,
                    this.quests.getAchievementData()
                )
            );

            /* Update region here because we receive quest info */
            this.updateRegion();

            this.achievementsLoaded = true;
        });

        this.quests.onQuestsReady(() => {
            this.send(
                new Messages.Quest(
                    Packets.QuestOpcode.QuestBatch,
                    this.quests.getQuestData()
                )
            );

            /* Update region here because we receive quest info */
            this.updateRegion();

            this.questsLoaded = true;
        });
    }

    intro() {
        if (this.ban > new Date()) {
            this.connection.sendUTF8('ban');
            this.connection.close(`Player: ${this.username} is banned.`);
        }

        if (this.x <= 0 || this.y <= 0) this.sendToSpawn();

        if (this.hitPoints.getHitPoints() < 0) {
            this.hitPoints.setHitPoints(this.getMaxHitPoints());
        }

        if (this.mana.getMana() < 0) this.mana.setMana(this.mana.getMaxMana());

        this.verifyRights();

        const info = {
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
            movementSpeed: this.getMovementSpeed(),
        };

        this.regionPosition = [this.x, this.y];

        /**
         * Send player data to client here
         */

        this.world.addPlayer(this);

        this.send(new Messages.Welcome(info));
    }

    verifyRights() {
        if (config.moderators.indexOf(this.username.toLowerCase()) > -1) {
            this.rights = 1;
        }

        if (
            config.administrators.indexOf(this.username.toLowerCase()) > -1 ||
            config.offlineMode
        ) {
            this.rights = 2;
        }
    }

    addExperience(exp) {
        this.experience += exp;

        const oldLevel = this.level;

        this.level = Formulas.expToLevel(this.experience);
        this.nextExperience = Formulas.nextExp(this.experience);
        this.prevExperience = Formulas.prevExp(this.experience);

        if (oldLevel !== this.level) {
            this.hitPoints.setMaxHitPoints(
                Formulas.getMaxHitPoints(this.level)
            );

            this.updateRegion();
        }

        const data: { [key: string]: any } = {
            id: this.instance,
            level: this.level,
        };

        /**
         * Sending two sets of data as other users do not need to
         * know the experience of another player.. (yet).
         */

        this.sendToAdjacentRegions(
            this.region,
            new Messages.Experience(data),
            this.instance
        );

        data.amount = exp;
        data.experience = this.experience;
        data.nextExperience = this.nextExperience;
        data.prevExperience = this.prevExperience;

        this.send(new Messages.Experience(data));

        this.sync();
    }

    heal(amount) {
        /**
         * Passed from the superclass...
         */

        if (!this.hitPoints || !this.mana) return;

        this.hitPoints.heal(amount);
        this.mana.heal(amount);

        this.sync();
    }

    healHitPoints(amount) {
        const type = 'health';

        this.hitPoints.heal(amount);

        this.sync();

        this.sendToAdjacentRegions(
            this.region,
            new Messages.Heal({
                id: this.instance,
                type,
                amount,
            })
        );
    }

    healManaPoints(amount) {
        const type = 'mana';

        this.mana.heal(amount);

        this.sync();

        this.sendToAdjacentRegions(
            this.region,
            new Messages.Heal({
                id: this.instance,
                type,
                amount,
            })
        );
    }

    eat(id) {
        const Item = Items.getPlugin(id);

        if (!Item) return;

        new Item(id).onUse(this);
    }

    equip(string, count, ability, abilityLevel) {
        const data = Items.getData(string);
        let type;
        const id = Items.stringToId(string);
        const power = Items.getLevelRequirement(string) / 2;

        if (!data || data === 'null') return;

        if (config.debug) {
            console.info(
                `Equipping item - ${[string, count, ability, abilityLevel]}`
            );
        }

        if (Items.isArmour(string)) type = Modules.Equipment.Armour;
        else if (Items.isWeapon(string)) type = Modules.Equipment.Weapon;
        else if (Items.isPendant(string)) type = Modules.Equipment.Pendant;
        else if (Items.isRing(string)) type = Modules.Equipment.Ring;
        else if (Items.isBoots(string)) type = Modules.Equipment.Boots;

        switch (type) {
            case Modules.Equipment.Armour:
                if (this.hasArmour() && this.armour.id !== 114) {
                    this.inventory.add(this.armour.getItem());
                }

                this.setArmour(id, count, ability, abilityLevel, power);
                break;

            case Modules.Equipment.Weapon:
                if (this.hasWeapon()) this.inventory.add(this.weapon.getItem());

                this.setWeapon(id, count, ability, abilityLevel, power);
                break;

            case Modules.Equipment.Pendant:
                if (this.hasPendant()) {
                    this.inventory.add(this.pendant.getItem());
                }

                this.setPendant(id, count, ability, abilityLevel, power);
                break;

            case Modules.Equipment.Ring:
                if (this.hasRing()) this.inventory.add(this.ring.getItem());

                this.setRing(id, count, ability, abilityLevel, power);
                break;

            case Modules.Equipment.Boots:
                if (this.hasBoots()) this.inventory.add(this.boots.getItem());

                this.setBoots(id, count, ability, abilityLevel, power);
                break;
        }

        this.send(
            new Messages.Equipment(Packets.EquipmentOpcode.Equip, {
                type,
                name: Items.idToName(id),
                string,
                count,
                ability,
                abilityLevel,
                power,
            })
        );

        this.sync();
    }

    updateRegion(force?) {
        this.world.region.sendRegion(this, this.region, force);
    }

    isInvisible(instance) {
        const entity = this.world.getEntityByInstance(instance);

        if (!entity) return false;

        return super.hasInvisibleId(entity.id) || super.hasInvisible(entity);
    }

    formatInvisibles() {
        return this.invisiblesIds.join(' ');
    }

    canEquip(string) {
        let requirement = Items.getLevelRequirement(string);

        if (requirement > Constants.MAX_LEVEL) {
            requirement = Constants.MAX_LEVEL;
        }

        if (requirement > this.level) {
            this.notify(
                `You must be at least level ${requirement} to equip this.`
            );

            return false;
        }

        return true;
    }

    die() {
        this.dead = true;

        if (this.deathCallback) this.deathCallback();

        this.send(new Messages.Death(this.instance));
    }

    teleport(x, y, isDoor?, animate?) {
        if (this.teleportCallback) this.teleportCallback(x, y, isDoor);

        this.sendToAdjacentRegions(
            this.region,
            new Messages.Teleport({
                id: this.instance,
                x,
                y,
                withAnimation: animate,
            })
        );

        this.setPosition(x, y);
        this.world.cleanCombat(this);
    }

    incrementCheatScore(amount) {
        if (this.combat.started) return;

        this.cheatScore += amount;

        if (this.cheatScoreCallback) this.cheatScoreCallback();
    }

    updatePVP(pvp, permanent?) {
        /**
         * No need to update if the state is the same
         */

        if (!this.region) return;

        if (this.pvp === pvp || this.permanentPVP) return;

        if (this.pvp && !pvp) this.notify('You are no longer in a PvP zone!');
        else this.notify('You have entered a PvP zone!');

        this.pvp = pvp;
        this.permanentPVP = permanent;

        this.sendToAdjacentRegions(
            this.region,
            new Messages.PVP(this.instance, this.pvp)
        );
    }

    updateOverlay(overlay) {
        if (this.overlayArea === overlay) return;

        this.overlayArea = overlay;

        if (overlay && overlay.id) {
            this.lightsLoaded = [];

            this.send(
                new Messages.Overlay(Packets.OverlayOpcode.Set, {
                    image: overlay.fog ? overlay.fog : 'empty',
                    colour: `rgba(0,0,0,${overlay.darkness})`,
                })
            );
        } else this.send(new Messages.Overlay(Packets.OverlayOpcode.Remove));
    }

    updateCamera(camera) {
        if (this.cameraArea === camera) return;

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
        } else this.send(new Messages.Camera(Packets.CameraOpcode.FreeFlow));
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

        if (this.profileToggleCallback) this.profileToggleCallback(state);
    }

    toggleInventory(state) {
        this.inventoryOpen = state;

        if (this.inventoryToggleCallback) this.inventoryToggleCallback(state);
    }

    toggleWarp(state) {
        this.warpOpen = state;

        if (this.warpToggleCallback) this.warpToggleCallback(state);
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

    getMovementSpeed() {
        const itemMovementSpeed = Items.getMovementSpeed(this.armour.name);
        const movementSpeed = itemMovementSpeed || this.defaultMovementSpeed;

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

    setArmour(id, count, ability, abilityLevel, power?) {
        if (!id) return;

        this.armour = new Armour(
            Items.idToString(id),
            id,
            count,
            ability,
            abilityLevel
        );
    }

    breakWeapon() {
        this.notify('Your weapon has been broken.');

        this.setWeapon(-1, 0, 0, 0);

        this.sendEquipment();
    }

    setWeapon(id, count, ability, abilityLevel, power?) {
        if (!id) return;

        this.weapon = new Weapon(
            Items.idToString(id),
            id,
            count,
            ability,
            abilityLevel
        );

        if (this.weapon.ranged) this.attackRange = 7;
    }

    setPendant(id, count, ability, abilityLevel, power?) {
        if (!id) return;

        this.pendant = new Pendant(
            Items.idToString(id),
            id,
            count,
            ability,
            abilityLevel
        );
    }

    setRing(id, count, ability, abilityLevel, power?) {
        if (!id) return;

        this.ring = new Ring(
            Items.idToString(id),
            id,
            count,
            ability,
            abilityLevel
        );
    }

    setBoots(id, count, ability, abilityLevel, power?) {
        if (!id) return;

        this.boots = new Boots(
            Items.idToString(id),
            id,
            count,
            ability,
            abilityLevel
        );
    }

    guessPosition(x, y) {
        this.potentialPosition = {
            x,
            y,
        };
    }

    setPosition(x, y) {
        if (this.dead) return;

        if (this.world.map.isOutOfBounds(x, y)) {
            x = 50;
            y = 89;
        }

        super.setPosition(x, y);

        this.sendToAdjacentRegions(
            this.region,
            new Messages.Movement(Packets.MovementOpcode.Move, {
                id: this.instance,
                x,
                y,
                forced: false,
                teleport: false,
            }),
            this.instance
        );
    }

    setOrientation(orientation) {
        this.orientation = orientation;

        if (this.orientationCallback) {
            // Will be necessary in the future.
            this.orientationCallback();
        }
    }

    setFuturePosition(x, y) {
        /**
         * Most likely will be used for anti-cheating methods
         * of calculating the actual time and duration for the
         * displacement.
         */

        this.futurePosition = {
            x,
            y,
        };
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
        return (
            this.armour && this.armour.name !== 'null' && this.armour.id !== -1
        );
    }

    hasWeapon() {
        return (
            this.weapon && this.weapon.name !== 'null' && this.weapon.id !== -1
        );
    }

    hasBreakableWeapon() {
        return this.weapon && this.weapon.breakable;
    }

    hasPendant() {
        return (
            this.pendant &&
            this.pendant.name !== 'null' &&
            this.pendant.id !== -1
        );
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
        return (
            this.weapon &&
            (this.weapon.hasCritical() ||
                this.weapon.hasExplosive() ||
                this.weapon.hasStun())
        );
    }

    // eslint-disable-next-line class-methods-use-this
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
            boots: this.boots.getData(),
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

        return this.finishedTutorial() ? { x: 325, y: 87 } : { x: 375, y: 41 };
    }

    getHit(target) {
        const defaultDamage = Formulas.getDamage(this, target);
        const isSpecial =
            100 - this.weapon.abilityLevel < Utils.randomInt(0, 100);

        if (!this.hasSpecialAttack() || !isSpecial) {
            return new Hit(Modules.Hits.Damage, defaultDamage);
        }

        switch (this.weapon.ability) {
            case Modules.Enchantment.Critical:
                /**
                 * Still experimental, not sure how likely it is that you're
                 * gonna do a critical strike. I just do not want it getting
                 * out of hand, it's easier to buff than to nerf..
                 */

                const multiplier = 1.0 + this.weapon.abilityLevel;
                const damage = defaultDamage * multiplier;

                return new Hit(Modules.Hits.Critical, damage);

            case Modules.Enchantment.Stun:
                return new Hit(Modules.Hits.Stun, defaultDamage);

            case Modules.Enchantment.Explosive:
                return new Hit(Modules.Hits.Explosive, defaultDamage);
        }
    }

    isMuted() {
        const time = new Date().getTime();

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
            message,
        });
    }

    sendToRegion(message) {
        this.world.push(Packets.PushOpcode.Region, {
            regionId: this.region,
            message,
        });
    }

    sendToAdjacentRegions(regionId, message, ignoreId?) {
        this.world.push(Packets.PushOpcode.Regions, {
            regionId,
            message,
            ignoreId,
        });
    }

    sendEquipment() {
        const info = {
            armour: this.armour.getData(),
            weapon: this.weapon.getData(),
            pendant: this.pendant.getData(),
            ring: this.ring.getData(),
            boots: this.boots.getData(),
        };

        this.send(new Messages.Equipment(Packets.EquipmentOpcode.Batch, info));
    }

    sendToSpawn() {
        const position = this.getSpawn();

        this.x = position.x;
        this.y = position.y;
    }

    sync() {
        /**
         * Function to be used for syncing up health,
         * mana, exp, and other variables
         */

        if (!this.hitPoints || !this.mana) return;

        const info = {
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
            movementSpeed: this.getMovementSpeed(),
        };

        this.sendToAdjacentRegions(this.region, new Messages.Sync(info));

        this.save();
    }

    notify(message) {
        if (!message) return;

        this.send(
            new Messages.Notification(Packets.NotificationOpcode.Text, message)
        );
    }

    stopMovement(force) {
        /**
         * Forcefully stopping the player will simply halt
         * them in between tiles. Should only be used if they are
         * being transported elsewhere.
         */

        this.send(
            new Messages.Movement(Packets.MovementOpcode.Stop, {
                instance: this.instance,
                force,
            })
        );
    }

    finishedTutorial() {
        if (!this.quests || !config.tutorialEnabled) return true;

        return this.quests.getQuest(0).isFinished();
    }

    finishedAchievement(id) {
        const achievement = this.quests.achievements[id];

        if (!achievement) return true;

        return achievement.isFinished();
    }

    finishAchievement(id) {
        const achievement = this.quests.achievements[id];

        if (!achievement || achievement.isFinished()) return;

        achievement.finish();
    }

    checkRegions() {
        if (!this.regionPosition) return;

        const diffX = Math.abs(this.regionPosition[0] - this.x);
        const diffY = Math.abs(this.regionPosition[1] - this.y);

        if (diffX >= 10 || diffY >= 10) {
            this.regionPosition = [this.x, this.y];

            if (this.regionCallback) this.regionCallback();
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
            this.setPosition(
                this.x + Utils.randomInt(-5, 5),
                this.y + Utils.randomInt(-5, 5)
            );
        }, 2000);
    }

    killCharacter(character) {
        if (this.killCallback) this.killCallback(character);
    }

    save() {
        if (config.offlineMode || this.isGuest) return;

        if ((!this.questsLoaded || !this.achievementsLoaded) && !this.new) {
            return;
        }

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

export default Player;
