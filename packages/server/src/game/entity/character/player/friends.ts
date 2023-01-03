import _ from 'lodash';

import Player from './player';

import { Friend } from '@kaetram/common/types/friends';
export default class Friends {
    // A friend object has a key of the username and a value of the online status
    private list: Friend = {};

    private loadCallback?: () => void;
    private addCallback?: (username: string) => void;
    private removeCallback?: (username: string) => void;

    public constructor(private player: Player) {}

    /**
     * Loads the list of friends from an array of usernames (received from the database).
     * @param friends Array of usernames containing the friends list.
     */

    public load(friends: string[] = []): void {
        // Nothing to load.
        if (friends.length === 0) return;

        _.each(friends, (username: string) => this.add(username));

        this.loadCallback?.();
    }

    /**
     * Adds a player (or a username) to the friends list.
     * @param player A player object or a username as a string.
     */

    public add(player: Player | string): void {
        let username = (typeof player === 'string' ? player : player.username).toLowerCase();

        // Check that someone isn't messing with the client input :)
        if (username.length > 32) return this.player.notify('That username is too long.');

        // Ensure the player is not already on the list.
        if (this.hasFriend(username))
            return this.player.notify('That player is already on your friends list.');

        // Ensure the player exists.
        this.player.database.exists(username, (exists: boolean) => {
            if (!exists) return this.player.notify('No player with that username exists.');

            this.list[username] = this.player.world.isOnline(username);

            this.addCallback?.(username);
        });
    }

    /**
     * Removes a player (or a username) from the friends list.
     * @param player The player object or a username as a string.
     */

    public remove(player: Player | string): void {
        let username = typeof player === 'string' ? player : player.username;

        // No username was found in the list.
        if (!this.hasFriend(username))
            return this.player.notify('That player is not in your friends list.');

        delete this.list[username];

        this.removeCallback?.(username);
    }

    /**
     * @returns A list of all friends.
     */

    public getFriendsList(): Friend {
        return this.list;
    }

    /**
     * @param username String of the username to check if they are a friend.
     * @returns Whether or not the player is a friend.
     */

    public hasFriend(username: string): boolean {
        return username in this.list;
    }

    /**
     * Updates the online status for a friend.
     * @param username The username of the friend.
     * @param status The online status of the friend.
     */

    public setStatus(username: string, status: boolean): void {
        this.list[username] = status;
    }

    /**
     * Callback for when the friends list has finished loading.
     */

    public onLoad(callback: () => void): void {
        this.loadCallback = callback;
    }

    /**
     * Callback for when a friend has been added to the list.
     * @param callback A callback with the username of the friend.
     */

    public onAdd(callback: (username: string) => void): void {
        this.addCallback = callback;
    }

    /**
     * Callback for when a friend has been removed from the list.
     * @param callback A callback with the username of the friend.
     */

    public onRemove(callback: (username: string) => void): void {
        this.removeCallback = callback;
    }

    /**
     * @returns Serializes the friends list into an array of usernames.
     */

    public serialize(): string[] {
        return Object.keys(this.list);
    }
}
