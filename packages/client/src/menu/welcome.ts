import Menu from './menu';

import { Modules } from '@kaetram/common/network';

export default class Welcome extends Menu {
    public override identifier: number = Modules.Interfaces.Welcome;

    public constructor() {
        super('#welcome', '#close-welcome');
    }
}
