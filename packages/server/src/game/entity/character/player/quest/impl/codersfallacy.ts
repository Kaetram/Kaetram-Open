import Quest from '../quest';
import Data from '../../../../../../../data/quests/codersfallacy.json';

export default class CodersFallacy extends Quest {
    public constructor(key: string) {
        super(key, Data);
    }
}
