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

            _.each(professions, function(profession) {
                var item = self.getItem(profession.id),
                    name = self.getName(profession.id),
                    info = $('<p></p>')

                name.text(profession.name);
                info.text('Level ' + profession.level + ' | ' + profession.percentage + '%');

                name.append(info);

                item.append(name);

                var listItem = $('<li></li>')

                listItem.append(item);

                self.professionsList.append(listItem);
            });
        },

        sync: function(info) {
            var self = this;

            if (!info)
                return;

            $('#professionName' + info.id).find('p').text('Level ' + info.level + ' | ' + info.percentage + '%');
        },

        getItem: function(id) {
            return $('<div id="professionItem' + id + '" class="professionItem"></div>');
        },

        getName: function(id) {
            return $('<div id="professionName' + id + '" class="professionName"></div>');
        }

    });

});
