import Player from './player';
import log from '../../../../util/log';

class Friends {
    player: Player;

    friends: any;

    constructor(player: Player) {
        this.player = player;

        this.friends = {};
    }

    update(info: any) {
        log.info(info);
    }

    add(username: string) {
        if (username in this.friends) {
            this.player.notify('That player is already in your friends list.');
            return;
        }

        this.friends[username] = 'offline';
    }

    remove(username: string) {
        delete this.friends[username];
    }

    getArray() {
        return this.friends;
    }
}

export default Friends;
