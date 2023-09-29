import Quest from '../quest';
import Data from '../../../../../../../data/quests/codersglitch2.json';

export default class CodersGlitch2 extends Quest {
    public constructor(key: string) {
        super(key, Data);
    }
}
