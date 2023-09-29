import Quest from '../quest';
import Data from '../../../../../../../data/quests/clamchowder.json';

export default class ClamChowder extends Quest {
    public constructor(key: string) {
        super(key, Data);
    }
}
