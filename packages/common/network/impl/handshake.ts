import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

export interface ClientHandshakePacketData {
    type: 'client';
    instance?: string; // Player's instance.
    serverId?: number;
}

export interface HubHandshakePacketData {
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

export interface AdminHandshakePacketData {
    type: 'admin';
    accessToken: string;
}

export type HandshakePacketData =
    | ClientHandshakePacketData
    | HubHandshakePacketData
    | AdminHandshakePacketData;
export type HandshakePacketCallback = (data: HandshakePacketData) => void;

export default class HandshakePacket extends Packet {
    public constructor(data: HandshakePacketData) {
        super(Packets.Handshake, undefined, data);
    }
}
