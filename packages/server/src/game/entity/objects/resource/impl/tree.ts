import Resource from '../resource';
import trees from '../../../../../../data/trees.json';

import Utils from '@kaetram/common/util/utils';
import { Modules } from '@kaetram/common/network';

export default class Tree extends Resource {
    public constructor(key: string, x: number, y: number) {
        super(Utils.createInstance(Modules.EntityType.Tree), key, x, y);

        this.setData(trees[key as keyof typeof trees]);
    }
}
