import Quest from '../quest';
import Data from '../../../../../../../data/quests/royaldrama.json';

export default class RoyalDrama extends Quest {
    public constructor(key: string) {
        super(key, Data);
    }
}
