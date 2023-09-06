export enum Login {
    Login,
    Register,
    Guest
}

export enum List {
    Spawns,
    Positions
}

export enum Equipment {
    Batch,
    Equip,
    Unequip,
    Style
}

export enum Movement {
    Request,
    Started,
    Step,
    Stop,
    Move,
    Follow,
    Entity,
    Speed
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

export enum Ability {
    Batch,
    Add,
    Update,
    Use,
    QuickSlot,
    Toggle
}

export enum Quest {
    Batch,
    Progress,
    Finish,
    Start
}

export enum Achievement {
    Batch,
    Progress
}

export enum Notification {
    Ok,
    YesNo,
    Text,
    Popup
}

export enum Experience {
    Sync,
    Skill
}

export enum NPC {
    Talk,
    Store,
    Bank,
    Enchant,
    Countdown
}

export const enum Trade {
    Request,
    Add,
    Remove,
    Accept,
    Close,
    Open
}

export enum Enchant {
    Select,
    Confirm
}

export enum Guild {
    Create,
    Login,
    Logout,
    Join,
    Leave,
    Rank,
    Update,
    Experience,
    Banner,
    List,
    Error,
    Chat,
    Promote,
    Demote,
    Kick
}

export enum Pointer {
    Location, // Pointer on the map
    Entity, // Pointer following an entity
    Relative,
    Remove
}

export enum Store {
    Open,
    Close,
    Buy,
    Sell,
    Update,
    Select
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

export enum Minigame {
    TeamWar,
    Coursing
}

export enum MinigameState {
    Lobby,
    End,
    Exit
}

// Generic actions for when in a minigame.
export enum MinigameActions {
    Score,
    End,
    Lobby,
    Exit
}

export enum Bubble {
    Entity,
    Position
}

export enum Effect {
    Add,
    Remove
}

export enum Friends {
    List,
    Add,
    Remove,
    Status,
    Sync
}

export enum Player {
    Login,
    Logout
}

export enum Crafting {
    Open,
    Select,
    Craft
}

export enum LootBag {
    Open,
    Take,
    Close
}

export enum Pet {
    Pickup
}

export enum Interface {
    Open,
    Close
}
