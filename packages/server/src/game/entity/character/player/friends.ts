import config from '@kaetram/common/config';
import { Opcodes } from '@kaetram/common/network';
import { FriendsPacket } from '@kaetram/common/network/impl';

import type Player from './player';
import type { Friend } from '@kaetram/common/network/impl/friends';

type SyncCallback = (username: string, status: boolean, serverId: number) => void;

export default class Friends {
    // A friend object has a key of the username and a value of the online status
    private list: Friend = {};

    private loadCallback?: () => void;
    private addCallback?: SyncCallback;
    private removeCallback?: (username: string) => void;
    private statusCallback?: SyncCallback;

    public constructor(private player: Player) {}

    /**
     * Loads the list of friends from an array of usernames (received from the database).
     * @param friends Array of usernames containing the friends list.
     */

    public load(friends: string[] = []): void {
        // Nothing to load.
        if (friends.length === 0) return;

        for (let username of friends) {
            let online = this.player.world.isOnline(username);

            this.list[username] = {
                online,
                serverId: online ? config.serverId : -1
            };
        }

        this.loadCallback?.();
    }

    /**
     * Adds a player (or a username) to the friends list.
     * @param player A player object or a username as a string.
     */

    public add(player: Player | string): void {
        let username = (typeof player === 'string' ? player : player.username).toLowerCase();

        // Check that someone isn't messing with the client input :)
        if (username.length > 32) return this.player.notify('misc:FRIENDS_USERNAME_TOO_LONG');

        if (username === this.player.username) return this.player.notify('misc:FRIENDS_ADD_SELF');

        // Ensure the player is not already on the list.
        if (this.hasFriend(username)) return this.player.notify('misc:FRIENDS_ALREADY_ADDED');

        // Ensure the player exists.
        this.player.database.exists(username, (exists: boolean) => {
            if (!exists) return this.player.notify('misc:FRIENDS_USER_DOES_NOT_EXIST');

            // Add the friend and check if they are online.
            let online = this.player.world.isOnline(username);

            this.list[username] = {
                online,
                serverId: online ? config.serverId : -1
            };

            // Add the friend to the list and pass on the online status to the client.
            this.addCallback?.(username, this.list[username].online, this.list[username].serverId);

            // If the friend we just added is not online we ask to sync across all servers.
            if (!online) this.sync([username]);
        });
    }

    /**
     * Removes a player (or a username) from the friends list.
     * @param player The player object or a username as a string.
     */

    public remove(player: Player | string): void {
        let username = (typeof player === 'string' ? player : player.username).toLowerCase();

        // No username was found in the list.
        if (!this.hasFriend(username)) return this.player.notify('misc:FRIENDS_NOT_IN_LIST');

        delete this.list[username];

        this.removeCallback?.(username);
    }

    /**
     * Relays a message to the hub to check across all servers whether a list
     * of players are online or not. We use this to synchronize the friends list
     * after we check the current server for online players.
     * @param inactiveFriends Optional parameter that defaults to the
     * current list of inactive friends if not specified.
     */

    public sync(inactiveFriends: string[] = this.getInactiveFriends()): void {
        // Skip if there are no inactive friends.
        if (inactiveFriends.length === 0) return;

        // Relay the message to the hub.
        this.player.world.client.send(
            new FriendsPacket(Opcodes.Friends.Sync, {
                username: this.player.username,
                inactiveFriends
            })
        );
    }

    /**
     * @returns A list of all friends.
     */

    public getFriendsList(): Friend {
        return this.list;
    }

    /**
     * @returns A string list of all the players that are inactive.
     */

    public getInactiveFriends(): string[] {
        return Object.keys(this.list).filter((username) => !this.list[username].online);
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
     * @param serverId The server ID of the friend.
     */

    public setStatus(username: string, status: boolean, serverId: number): void {
        let friend = this.list[username];

        if (!friend) return;

        friend.online = status;
        friend.serverId = status ? serverId : -1;

        this.statusCallback?.(username, status, friend.serverId);
    }

    /**
     * Takes a list of active friends and appends it onto the current list.
     * @param list The list of active friends.
     */

    public setActiveFriends(list: Friend): void {
        for (let username in list) {
            let friend = list[username];

            this.setStatus(username, friend.online, friend.serverId);
        }
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

    public onAdd(callback: SyncCallback): void {
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
     * An update is passed to the client when a friend has logged in or out.
     * @param callback Contains the username of the friend and their online status.
     */

    public onStatus(callback: SyncCallback): void {
        this.statusCallback = callback;
    }

    /**
     * @returns Serializes the friends list into an array of usernames.
     */

    public serialize(): string[] {
        return Object.keys(this.list);
    }
}
