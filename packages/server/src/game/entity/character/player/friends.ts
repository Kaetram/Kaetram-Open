import log from '../../../../util/log';

import type Player from './player';

type Status = 'offline';

interface FriendsList {
    [username: string]: Status;
}

export interface FriendsArray {
    username: string;
    friends: FriendsList;
}

export default class Friends {
    friends: FriendsList = {};

    constructor(private player: Player) {}

    update(info: unknown): void {
        log.info(info);
    }

    add(username: string): void {
        if (username in this.friends) {
            this.player.notify('That player is already in your friends list.');
            return;
        }

        this.friends[username] = 'offline';
    }

    remove(username: string): void {
        delete this.friends[username];
    }

    getArray(): FriendsArray {
        return {
            username: this.player.username,
            friends: this.friends
        };
    }
}
