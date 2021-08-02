import $ from 'jquery';
import _ from 'lodash';

import Page from '../page';

import type { AchievementData, QuestInfo } from '@kaetram/common/types/info';
import type { QuestFinishData, QuestProgressData } from '@kaetram/common/types/messages';

export default class Quest extends Page {
    private quests = $('#questList');
    private questList = this.quests.find('ul');
    private questCount = $('#questCount');
    private finishedQuests = 0;
    private questsLength = 0;

    private achievements = $('#achievementList');
    private achievementsList = this.achievements.find('ul');
    private achievementsCount = $('#achievementCount');
    private finishedAchievements = 0;
    private achievementsLength = 0;

    public constructor() {
        super('#questPage');
    }

    public loadAchievements(achievements: AchievementData[]): void {
        this.achievementsLength = achievements.length;

        _.each(achievements, (achievement) => {
            let item = this.getItem(false, achievement.id),
                name = this.getName(false, achievement.id);

            name.text('????????');

            name.css('background', 'rgba(255, 10, 10, 0.3)');

            if (achievement.progress > 0 && achievement.progress < 9999) {
                name.css('background', 'rgba(255, 255, 10, 0.4)');

                name.text(
                    achievement.name +
                        (achievement.count > 2
                            ? ` ${achievement.progress - 1}/${achievement.count - 1}`
                            : '')
                );
            } else if (achievement.progress > 9998) {
                name.text(achievement.name);
                name.css('background', 'rgba(10, 255, 10, 0.3)');
            }

            if (achievement.finished) this.finishedAchievements++;

            item.append(name);

            let listItem = $('<li></li>');

            listItem.append(item);

            this.achievementsList.append(listItem);
        });

        this.updateCount();
    }

    public loadQuests(quests: QuestInfo[]): void {
        this.questsLength = quests.length;

        _.each(quests, (quest) => {
            let item = this.getItem(true, quest.id),
                name = this.getName(true, quest.id);

            name.text(quest.name);

            name.css('background', 'rgba(255, 10, 10, 0.3)');

            if (quest.stage > 0 && quest.stage < 9999)
                name.css('background', 'rgba(255, 255, 10, 0.4)');
            else if (quest.stage > 9998) name.css('background', 'rgba(10, 255, 10, 0.3)');

            if (quest.finished) this.finishedQuests++;

            item.append(name);

            let listItem = $('<li></li>');

            listItem.append(item);

            this.questList.append(listItem);
        });

        this.updateCount();
    }

    public progress(info: QuestProgressData): void {
        let item = info.isQuest ? this.getQuest(info.id) : this.getAchievement(info.id);

        if (!item) return;

        let name = item.find(`${info.isQuest ? '#quest' : '#achievement'}${info.id}name`);

        if (!name) return;

        if (!info.isQuest && info.count! > 2)
            name.text(`${info.name} ${info.progress! - 1}/${info.count! - 1}`);
        else name.text(info.name!);

        name.css('background', 'rgba(255, 255, 10, 0.4)');

        this.updateCount();
    }

    public finish(info: QuestFinishData): void {
        let item = info.isQuest ? this.getQuest(info.id) : this.getAchievement(info.id);

        if (!item) return;

        let name = item.find(`${info.isQuest ? '#quest' : '#achievement'}${info.id}name`);

        if (!name) return;

        if (!info.isQuest) {
            name.text(info.name!);
            this.finishedAchievements++;
        }

        name.css('background', 'rgba(10, 255, 10, 0.3)');

        if (info.isQuest) this.finishedQuests++;

        this.updateCount();
    }

    private updateCount(): void {
        if (this.finishedAchievements !== 0 && this.achievementsLength !== 0)
            this.achievementsCount.html(`${this.finishedAchievements}/${this.achievementsLength}`);

        if (this.finishedQuests !== 0 && this.questsLength !== 0)
            this.questCount.html(`${this.finishedQuests}/${this.questsLength}`);
    }

    public clear(): void {
        this.achievementsList.empty();
        this.questList.empty();
    }

    private getQuest(id: number): JQuery {
        return $(this.questList.find('li')[id]).find(`#quest${id}`);
    }

    private getAchievement(id: number): JQuery {
        return $(this.achievementsList.find('li')[id]).find(`#achievement${id}`);
    }

    /**
     * Might as well properly organize them based
     * on their type of item and id (index).
     */

    private getItem(isQuest: boolean, id: number): JQuery {
        return $(`<div id="${isQuest ? 'quest' : 'achievement'}${id}" class="questItem"></div>`);
    }

    private getName(isQuest: boolean, id: number): JQuery {
        return $(
            `<div id="${isQuest ? 'quest' : 'achievement'}${id}name" class="questName"></div>`
        );
    }
}
