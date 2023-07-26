import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

export interface ClientHandshakePacket {
    type: 'client';
    instance?: string; // Player's instance.
    serverId?: number;
}

export interface HubHandshakePacket {
    type: 'hub';
    gVer: string; // Game version.
    name: string;
    serverId: number;
    accessToken: string; // Denied if mismatches
    remoteHost: string; // Relayed to game clients as the server's IP.
    port: number;
    players: string[];
    maxPlayers: number;
}

export interface AdminHandshakePacket {
    type: 'admin';
    accessToken: string;
}

export type HandshakePacketData = ClientHandshakePacket | HubHandshakePacket | AdminHandshakePacket;
export type HandshakePacketCallback = (data: ClientHandshakePacket) => void;

export default class HandshakePacket extends Packet {
    public constructor(data: HandshakePacketData) {
        super(Packets.Handshake, undefined, data);
    }
}
