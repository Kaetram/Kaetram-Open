/**
 * These are types related to the hub-server packet exchange.
 * We separate them from the rest of packets for brevity.
 */

import type { Packets } from '@kaetram/common/network';
import type { Friend } from '../friends';

export interface ChatPacketData {
    source: string;
    message?: string;

    colour?: string;
    target?: string;

    success?: boolean;
    notFound?: boolean;
}

export interface FriendsPacketData {
    username: string;
    activeFriends?: Friend;
    inactiveFriends?: string[];
}

export type RelayPacketData = [string, [Packets, number, { [key: string]: unknown }]];
