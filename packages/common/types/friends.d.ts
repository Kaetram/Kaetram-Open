export interface FriendInfo {
    online: boolean;
    serverId: number;
}

export interface Friend {
    [username: string]: FriendInfo;
}
