import Quest from '../quest';
import Data from '../../../../../../../data/quests/herbalistdesperation.json';

export default class Scavenger extends Quest {
    public constructor(key: string) {
        super(key, Data);
    }
}
