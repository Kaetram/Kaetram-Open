import Packet from '../packet';
import { Packets } from '@kaetram/common/network';
import config from '@kaetram/common/config';

export default class Handshake extends Packet {
    public constructor(instance: string) {
        super(Packets.Handshake, undefined, {
            instance,
            debug: config.debugging
        });
    }
}
