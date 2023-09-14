import Quest from '../quest';
import Data from '../../../../../../../data/quests/ricksroll.json';

export default class RicksRoll extends Quest {
    public constructor(key: string) {
        super(key, Data);
    }
}
