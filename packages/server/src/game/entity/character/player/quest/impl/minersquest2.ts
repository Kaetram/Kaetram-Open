import Quest from '../quest';
import Data from '../../../../../../../data/quests/minersquest2.json';

export default class MinersQuest2 extends Quest {
    public constructor(key: string) {
        super(key, Data);
    }
}
