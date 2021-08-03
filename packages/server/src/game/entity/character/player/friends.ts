import log from '@kaetram/common/util/log';

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
    private friends: FriendsList = {};

    public constructor(private player: Player) {}

    public update(info: unknown): void {
        log.info(info);
    }

    public add(username: string): void {
        if (username in this.friends) {
            this.player.notify('That player is already in your friends list.');
            return;
        }

        this.friends[username] = 'offline';
    }

    public remove(username: string): void {
        delete this.friends[username];
    }

    public getArray(): FriendsArray {
        return {
            username: this.player.username,
            friends: this.friends
        };
    }
}
