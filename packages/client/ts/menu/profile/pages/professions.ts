import $ from 'jquery';
import _ from 'lodash';

import Game from '../../../game';
import Page from '../page';

/**
 * @todo
 * Replace this with a `common` interface linking to the server's `Profession` class.
 */
interface ProfessionsInfo {
    id: string;
    name: string;
    level: number;
    percentage: number;
}

export default class Professions extends Page {
    professions: JQuery;
    professionsList: JQuery<HTMLUListElement>;
    game: Game;

    constructor(game: Game) {
        super('#professionsPage');

        this.professions = $('#professionsList');

        this.professionsList = this.professions.find('ul');

        this.game = game;
    }

    load(professions: ProfessionsInfo[]): void {
        _.each(professions, (profession) => {
            const item = this.getItem(profession.id),
                name = this.getName(profession.id),
                info = $('<p></p>');

            name.text(profession.name);
            info.text(`Level ${profession.level} | ${profession.percentage}%`);

            name.append(info);

            item.append(name);

            const listItem = $('<li></li>');

            listItem.append(item);

            this.professionsList.append(listItem);
        });
    }

    sync(info: ProfessionsInfo): void {
        if (!info) return;

        $(`#professionName${info.id}`).find('p').text(`Level ${info.level} | ${info.percentage}%`);
    }

    getItem(id: string): JQuery {
        return $(`<div id="professionItem${id}" class="professionItem"></div>`);
    }

    getName(id: string): JQuery {
        return $(`<div id="professionName${id}" class="professionName"></div>`);
    }
}
