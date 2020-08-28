import Page from '../page';
import $ from 'jquery';
import _ from 'lodash';

export default class Professions extends Page {
    constructor(game) {
        super('#professionsPage');

        this.professions = $('#professionsList');

        this.professionsList = this.professions.find('ul');

        this.game = game;
    }

    load(professions) {
        var self = this;

        _.each(professions, function (profession) {
            var item = self.getItem(profession.id),
                name = self.getName(profession.id),
                info = $('<p></p>');

            name.text(profession.name);
            info.text('Level ' + profession.level + ' | ' + profession.percentage + '%');

            name.append(info);

            item.append(name);

            var listItem = $('<li></li>');

            listItem.append(item);

            self.professionsList.append(listItem);
        });
    }

    sync(info) {
        var self = this;

        if (!info) return;

        $('#professionName' + info.id)
            .find('p')
            .text('Level ' + info.level + ' | ' + info.percentage + '%');
    }

    getItem(id) {
        return $('<div id="professionItem' + id + '" class="professionItem"></div>');
    }

    getName(id) {
        return $('<div id="professionName' + id + '" class="professionName"></div>');
    }
}
