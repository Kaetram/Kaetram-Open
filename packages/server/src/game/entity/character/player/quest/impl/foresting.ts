import Quest from '../quest';
import Data from '../../../../../../../data/quests/foresting.json';

export default class Foresting extends Quest {
    public constructor(key: string) {
        super(key, Data);
    }
}
