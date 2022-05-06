import $ from 'jquery';
import _ from 'lodash';

import Page from '../page';

import type { ProfessionsInfo } from '@kaetram/common/types/info';
import type { ProfessionUpdateData } from '@kaetram/common/types/messages';

export default class Professions extends Page {
    private professions = $('#professions-list');
    private professionsList = this.professions.find('ul');

    public constructor() {
        super('#professions-page');
    }

    public loadProfessions(professions: ProfessionsInfo[]): void {
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

    public sync(info: ProfessionUpdateData): void {
        if (!info) return;

        $(`#profession-name${info.id}`).find('p').text(`Level ${info.level} | ${info.percentage}%`);
    }

    private getItem(id: number): JQuery {
        return $(`<div id="profession-item${id}" class="profession-item"></div>`);
    }

    private getName(id: number): JQuery {
        return $(`<div id="profession-name${id}" class="profession-name"></div>`);
    }
}
