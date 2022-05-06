import Packet from '../packet';
import { Packets } from '@kaetram/common/network';

export default class Chat extends Packet {
    public constructor(data: unknown) {
        super(Packets.Chat, undefined, data);
    }
}
