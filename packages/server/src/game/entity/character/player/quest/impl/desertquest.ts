import Quest from '../quest';
import Data from '../../../../../../../data/quests/desertquest.json';

export default class DesertQuest extends Quest {
    public constructor(key: string) {
        super(key, Data);
    }
}
