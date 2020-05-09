define(['jquery', '../page'], function($, Page) {

    return Page.extend({

        init: function(game) {
            var self = this;

            self._super('#professionsPage');

            self.professions = $('#professionsList');

            self.professionsList = self.professions.find('ul');

            self.game = game;
        },

        load: function(professions) {
            var self = this;

            log.info(professions);

            _.each(professions, function(profession) {
                var item = self.getItem(profession.id),
                    name = self.getName(profession.id);

                name.text(profession.name);

                item.append(name);

                var listItem = $('<li></li>')

                listItem.append(item);

                self.professionsList.append(listItem);
            });
        },

        sync: function(data) {
            var self = this;

            log.info('Received profession data');
            log.info(data);
        },

        getItem: function(id) {
            return $('<div id="profession' + id + '" class="professionItem"></div>');
        },

        getName: function(id) {
            return $('<div id="profession' + id + '" class="professionName"></div>');
        }

    });

});
