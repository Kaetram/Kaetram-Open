import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';

export default class Projectile extends Packet {
    public constructor(opcode: Opcodes.Projectile, data: unknown) {
        super(Packets.Projectile, opcode, data);
    }
}
