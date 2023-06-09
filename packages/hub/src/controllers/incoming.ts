import log from '@kaetram/common/util/log';
import config from '@kaetram/common/config';
import Utils from '@kaetram/common/util/utils';
import { Packets, Opcodes } from '@kaetram/common/network';

import type { GuildPacket } from '@kaetram/common/types/messages/outgoing';
import type Server from '../model/server';
import type {
    ChatPacket,
    FriendsPacket,
    HandshakePacket,
    PlayerPacket
} from '@kaetram/common/types/messages/hub';

export default class Incoming {}
