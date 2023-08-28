import Quest from '../quest';
import Data from '../../../../../../../data/quests/sorcery.json';

export default class Sorcery extends Quest {
    public constructor(key: string) {
        super(key, Data);
    }
}
