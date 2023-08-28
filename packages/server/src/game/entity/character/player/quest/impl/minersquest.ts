import Quest from '../quest';
import Data from '../../../../../../../data/quests/minersquest.json';

export default class MinersQuest extends Quest {
    public constructor(key: string) {
        super(key, Data);
    }
}
