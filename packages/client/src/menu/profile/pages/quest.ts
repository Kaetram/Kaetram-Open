import $ from 'jquery';
import _ from 'lodash';

import Page from '../page';

import { QuestData } from '@kaetram/common/types/quest';

import type { AchievementData } from '@kaetram/common/types/info';
import type { QuestFinishData, QuestProgressData } from '@kaetram/common/types/messages';

export default class Quest extends Page {
    private quests = $('#quest-list');
    private questList = this.quests.find('ul');
    private questCount = $('#quest-count');
    private finishedQuests = 0;
    private questsLength = 0;

    private achievements = $('#achievement-list');
    private achievementsList = this.achievements.find('ul');
    private achievementsCount = $('#achievement-count');
    private finishedAchievements = 0;
    private achievementsLength = 0;

    public constructor() {
        super('#questPage');
    }

    public loadAchievements(achievements: AchievementData[]): void {
        this.achievementsLength = achievements.length;

        // _.each(achievements, (achievement) => {
        //     let item = this.getItem(false, achievement.id),
        //         name = this.getName(false, achievement.id);

        //     name.text('????????');

        //     name.css('background', 'rgba(255, 10, 10, 0.3)');

        //     if (achievement.progress > 0 && achievement.progress < 9999) {
        //         name.css('background', 'rgba(255, 255, 10, 0.4)');

        //         name.text(
        //             achievement.name +
        //                 (achievement.count > 2
        //                     ? ` ${achievement.progress - 1}/${achievement.count - 1}`
        //                     : '')
        //         );
        //     } else if (achievement.progress > 9998) {
        //         name.text(achievement.name);
        //         name.css('background', 'rgba(10, 255, 10, 0.3)');
        //     }

        //     if (achievement.finished) this.finishedAchievements++;

        //     item.append(name);

        //     let listItem = $('<li></li>');

        //     listItem.append(item);

        //     this.achievementsList.append(listItem);
        // });

        this.updateCount();
    }

    /**
     * TODO - Update this in the future. The `loadQuests` function should
     * be used with the `progress` function to alleviate code duplication.
     * Expected to do this when client refactoring starts.
     */

    public loadQuests(quests: QuestData[]): void {
        this.questsLength = quests.length;

        _.each(quests, (quest) => {
            let item = this.getItem(true, quest.key),
                name = this.getName(true, quest.key);

            name.text(quest.name!);

            name.css('background', 'rgba(255, 10, 10, 0.3)');

            if (quest.stage >= quest.stageCount) {
                name.css('background', 'rgba(10, 255, 10, 0.3)');
                this.finishedQuests++;
            } else if (quest.stage > 0) name.css('background', 'rgba(255, 255, 10, 0.4)');

            item.append(name);

            let listItem = $('<li></li>');

            listItem.append(item);

            this.questList.append(listItem);
        });

        this.updateCount();
    }

    public progress(info: QuestProgressData): void {
        // TODO - upgrade to not use hardcoded values.
        let name = this.findQuestName(info.key);

        name.css('background', 'rgba(255, 10, 10, 0.3)');

        if (info.stage > 0) name.css('background', 'rgba(255, 255, 10, 0.4)');
        if (info.stage >= info.stageCount) {
            this.finishedQuests++;
            name.css('background', 'rgba(10, 255, 10, 0.3)');
        }

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

    private findQuestName(key: string): JQuery {
        return this.questList.find(`#quest${key}name`);
    }

    private getAchievement(id: number): JQuery {
        return $(this.achievementsList.find('li')[id]).find(`#achievement${id}`);
    }

    /**
     * Might as well properly organize them based
     * on their type of item and id (index).
     */

    private getItem(isQuest: boolean, key: string): JQuery {
        return $(`<div id="${isQuest ? 'quest' : 'achievement'}${key}" class="quest-item"></div>`);
    }

    private getName(isQuest: boolean, key: string): JQuery {
        return $(
            `<div id="${isQuest ? 'quest' : 'achievement'}${key}name" class="quest-name"></div>`
        );
    }
}
