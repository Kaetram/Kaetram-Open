export enum Login {
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

export enum Container {
    Batch,
    Add,
    Remove,
    Select,
    Swap
}

export enum Quest {
    Batch,
    Progress,
    Finish
}

export enum Achievement {
    Batch,
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
    Skill
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
    Location, // Pointer on the map
    Relative, // Pointer relative to the screen
    Entity, // Pointer following an entity
    Remove,
    Button // Pointer for a button
}

export enum Store {
    Open,
    Close,
    Buy,
    Sell,
    Update,
    Select
}

export enum TeamWar {
    Enter,
    Team,
    Red,
    Blue,
    Leave,
    Countdown
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

export enum Command {
    CtrlClick
}

export enum Skill {
    Batch,
    Update
}
