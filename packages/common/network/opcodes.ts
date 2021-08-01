export enum Intro {
    Login,
    Register,
    Guest
}

export enum Equipment {
    Batch,
    Equip,
    Unequip
}

export enum Movement {
    Request,
    Started,
    Step,
    Stop,
    Move,
    Orientate,
    Follow,
    Entity,
    Freeze,
    Stunned,
    Zone
}

export enum Target {
    Talk,
    Attack,
    None,
    Object
}

export enum Combat {
    Initiate,
    Hit,
    Finish,
    Sync
}

export enum Projectile {
    Static,
    Dynamic,
    Create,
    Update,
    Impact
}

export enum Network {
    Ping,
    Pong
}

export enum Inventory {
    Batch,
    Add,
    Remove,
    Select
}

export enum Bank {
    Batch,
    Add,
    Remove,
    Select
}

export enum Quest {
    QuestBatch,
    AchievementBatch,
    Progress,
    Finish
}

export enum Notification {
    Ok,
    YesNo,
    Text,
    Popup
}

export enum Experience {
    Combat,
    Profession
}

export enum NPC {
    Talk,
    Store,
    Bank,
    Enchant,
    Countdown
}

export enum Trade {
    Request,
    Accept,
    Decline
}

export enum Enchant {
    Select,
    Remove,
    Enchant,
    Update
}

export enum Guild {
    Create,
    Join,
    Leave,
    Rank,
    Loot,
    Update
}

export enum Pointer {
    Location,
    NPC,
    Relative,
    Remove,
    Button
}

export enum Shop {
    Open,
    Buy,
    Sell,
    Refresh,
    Select,
    Remove
}

export enum Minigame {
    TeamWar
}

export enum TeamWar {
    Enter,
    Team,
    Red,
    Blue,
    Leave,
    Countdown
}

export enum Region {
    Render,
    Modify,
    Collision,
    Update,
    Reset,
    Tileset
}

export enum Overlay {
    Set,
    Remove,
    Lamp,
    RemoveLamps,
    Darkness
}

export enum Camera {
    LockX,
    LockY,
    FreeFlow,
    Player
}

export enum Push {
    Broadcast,
    Selectively,
    Player,
    Players,
    Region,
    Regions,
    NameArray,
    OldRegions
}

export enum Command {
    CtrlClick
}

export enum Profession {
    Batch,
    Update
}
