/**
 * These are types related to the hub-server packet exchange.
 * We separate them from the rest of packets for brevity.
 */

import type { Friend } from '../friends';

export interface PlayerPacket {
    username: string;
    serverId?: number;
    guild?: string;
}

export interface ChatPacket {
    source: string;
    message?: string;

    colour?: string;
    target?: string;

    success?: boolean;
    notFound?: boolean;
}

export interface FriendsPacket {
    username: string;
    activeFriends?: Friend;
    inactiveFriends?: string[];
}

export type RelayPacket = [string, [number, never, never]];
