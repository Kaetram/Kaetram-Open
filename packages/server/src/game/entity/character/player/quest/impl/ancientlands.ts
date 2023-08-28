import Quest from '../quest';
import Data from '../../../../../../../data/quests/ancientlands.json';

export default class AncientLands extends Quest {
    public constructor(key: string) {
        super(key, Data);
    }
}
