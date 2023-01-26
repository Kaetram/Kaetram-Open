import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { PlayerData } from '@kaetram/common/types/player';

export default class Welcome extends Packet {
    public constructor(data: PlayerData) {
        super(Packets.Welcome, undefined, data);
    }
}
