import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes } from '@kaetram/common/network';
import type { DefinePacket } from './utils';

type Trade = DefinePacket<{
    [Opcodes.Trade.Request]: { instance?: string };
    [Opcodes.Trade.Add]: { instance?: string; index: number; count?: number; key?: string };
    [Opcodes.Trade.Remove]: { instance?: string; index: number; count?: number };
    [Opcodes.Trade.Accept]: { message?: string };
    [Opcodes.Trade.Close]: { [key: string]: unknown };
    [Opcodes.Trade.Open]: { instance: string };
}>;

export type TradePacketData = Trade['Data'];
export type TradePacketValues = Trade['Values'];
export type TradePacketCallback = Trade['Callback'];
export type TradePacketOutgoing = Trade['Outgoing'];

export default class TradePacket<O extends Opcodes.Trade> extends Packet {
    public constructor(opcode: O, data: TradePacketData[O]) {
        super(Packets.Trade, opcode, data);
    }
}
