import Quest from '../quest';
import Data from '../../../../../../../data/quests/artsandcrafts.json';

export default class ArtsAndCrafts extends Quest {
    public constructor(key: string) {
        super(key, Data);
    }
}
