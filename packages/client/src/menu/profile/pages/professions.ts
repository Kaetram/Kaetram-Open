import $ from 'jquery';
import _ from 'lodash';

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
    private professions = $('#professionsList');
    private professionsList = this.professions.find('ul');

    public constructor() {
        super('#professionsPage');
    }

    public load(professions: ProfessionsInfo[]): void {
        _.each(professions, (profession) => {
            let item = this.getItem(profession.id),
                name = this.getName(profession.id),
                info = $('<p></p>');

            name.text(profession.name);
            info.text(`Level ${profession.level} | ${profession.percentage}%`);

            name.append(info);

            item.append(name);

            let listItem = $('<li></li>');

            listItem.append(item);

            this.professionsList.append(listItem);
        });
    }

    public sync(info: ProfessionsInfo): void {
        if (!info) return;

        $(`#professionName${info.id}`).find('p').text(`Level ${info.level} | ${info.percentage}%`);
    }

    private getItem(id: string): JQuery {
        return $(`<div id="professionItem${id}" class="professionItem"></div>`);
    }

    private getName(id: string): JQuery {
        return $(`<div id="professionName${id}" class="professionName"></div>`);
    }
}
