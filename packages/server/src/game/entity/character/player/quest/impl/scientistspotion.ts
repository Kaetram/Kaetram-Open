import Quest from '../quest';
import Data from '../../../../../../../data/quests/scientistspotion.json';

export default class ScientistsPotion extends Quest {
    public constructor(key: string) {
        super(key, Data);
    }
}
