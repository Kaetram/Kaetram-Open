/* global log, _ */

define(['jquery', '../page'], function($, Page) {

    return Page.extend({

        init: function(game) {
            var self = this;

            self._super('#statePage');

            self.game = game;
            self.player = game.player;

            self.name = $('#profileName');
            self.level = $('#profileLevel');
            self.experience = $('#profileExperience');

            self.weaponSlot = $('#weaponSlot');
            self.armourSlot = $('#armourSlot');
            self.pendantSlot = $('#pendantSlot');
            self.ringSlot = $('#ringSlot');
            self.bootsSlot = $('#bootsSlot');

            self.slots = [self.weaponSlot, self.armourSlot, self.pendantSlot, self.ringSlot, self.bootsSlot];

            self.loaded = false;

            self.load();
        },

        resize: function() {
            this.loadSlots();
        },

        load: function() {
            var self = this;

            if (!self.game.player.armour)
                return;

            self.name.text(self.player.username);
            self.level.text(self.player.level);
            self.experience.text(self.player.experience);

            self.loadSlots();

            self.loaded = true;

            self.weaponSlot.click(function() {
                self.game.socket.send(Packets.Equipment, [Packets.EquipmentOpcode.Unequip, 'weapon']);
            });

            self.armourSlot.click(function() {
                self.game.socket.send(Packets.Equipment, [Packets.EquipmentOpcode.Unequip, 'armour']);
            });

            self.pendantSlot.click(function() {
                self.game.socket.send(Packets.Equipment, [Packets.EquipmentOpcode.Unequip, 'pendant']);
            });

            self.ringSlot.click(function() {
                self.game.socket.send(Packets.Equipment, [Packets.EquipmentOpcode.Unequip, 'ring']);
            });

            self.bootsSlot.click(function() {
                self.game.socket.send(Packets.Equipment, [Packets.EquipmentOpcode.Unequip, 'boots']);
            });

        },

        loadSlots: function() {
            var self = this;

            self.weaponSlot.css('background-image', self.getImageFormat(self.getScale(), self.player.weapon.string));
            self.armourSlot.css('background-image', self.getImageFormat(self.getScale(), self.player.armour.string));
            self.pendantSlot.css('background-image', self.getImageFormat(self.getScale(), self.player.pendant.string));
            self.ringSlot.css('background-image', self.getImageFormat(self.getScale(), self.player.ring.string));
            self.bootsSlot.css('background-image', self.getImageFormat(self.getScale(), self.player.boots.string));

            if (self.game.getScaleFactor() === 1)
                self.forEachSlot(function(slot) { slot.css('background-size', '600%'); });
        },

        update: function() {
            var self = this;

            self.level.text(self.player.level);
            self.experience.text(self.player.experience);

            self.loadSlots();
        },

        forEachSlot: function(callback) {
            _.each(this.slots, function(slot) {
                callback(slot);
            });
        },

        getScale: function() {
            return this.game.renderer.getDrawingScale();
        }

    });

});