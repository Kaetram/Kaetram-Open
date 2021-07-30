enum Packets {
    Handshake,
    Intro,
    Welcome,
    Spawn,
    List,
    Who,
    Equipment,
    Ready,
    Sync,
    Movement,
    Teleport,
    Request,
    Despawn,
    Target,
    Combat,
    Animation,
    Projectile,
    Population,
    Points,
    Network,
    Chat,
    Command,
    Inventory,
    Bank,
    Ability,
    Quest,
    Notification,
    Blink,
    Heal,
    Experience,
    Death,
    Audio,
    NPC,
    Respawn,
    Trade,
    Enchant,
    Guild,
    Pointer,
    PVP,
    Click,
    Warp,
    Shop,
    Minigame,
    Region,
    Overlay,
    Camera,
    Bubble,
    Client,
    Profession,
    BuildUp
}

enum IntroOpcode {
    Login,
    Register,
    Guest
}

enum EquipmentOpcode {
    Batch,
    Equip,
    Unequip
}

enum MovementOpcode {
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

enum TargetOpcode {
    Talk,
    Attack,
    None,
    Object
}

enum CombatOpcode {
    Initiate,
    Hit,
    Finish,
    Sync
}

enum ProjectileOpcode {
    Static,
    Dynamic,
    Create,
    Update,
    Impact
}

enum NetworkOpcode {
    Ping,
    Pong
}

enum InventoryOpcode {
    Batch,
    Add,
    Remove,
    Select
}

enum BankOpcode {
    Batch,
    Add,
    Remove,
    Select
}

enum QuestOpcode {
    QuestBatch,
    AchievementBatch,
    Progress,
    Finish
}

enum NotificationOpcode {
    Ok,
    YesNo,
    Text,
    Popup
}

enum ExperienceOpcode {
    Combat,
    Profession
}

enum NPCOpcode {
    Talk,
    Store,
    Bank,
    Enchant,
    Countdown
}

enum TradeOpcode {
    Request,
    Accept,
    Decline
}

enum EnchantOpcode {
    Select,
    Remove,
    Enchant,
    Update
}

enum GuildOpcode {
    Create,
    Join,
    Leave,
    Rank,
    Loot,
    Update
}

enum PointerOpcode {
    Location,
    NPC,
    Relative,
    Remove,
    Button
}

enum ShopOpcode {
    Open,
    Buy,
    Sell,
    Refresh,
    Select,
    Remove
}

enum MinigameOpcode {
    TeamWar
}

enum TeamWarOpcode {
    Enter,
    Team,
    Red,
    Blue,
    Leave,
    Countdown
}

enum RegionOpcode {
    Render,
    Modify,
    Collision,
    Update,
    Reset,
    Tileset
}

enum OverlayOpcode {
    Set,
    Remove,
    Lamp,
    RemoveLamps,
    Darkness
}

enum CameraOpcode {
    LockX,
    LockY,
    FreeFlow,
    Player
}

enum PushOpcode {
    Broadcast,
    Selectively,
    Player,
    Players,
    Region,
    Regions,
    NameArray,
    OldRegions
}

enum CommandOpcode {
    CtrlClick
}

enum ProfessionOpcode {
    Batch,
    Update
}

export default {
    ...Packets,
    IntroOpcode,
    EquipmentOpcode,
    MovementOpcode,
    TargetOpcode,
    CombatOpcode,
    ProjectileOpcode,
    NetworkOpcode,
    InventoryOpcode,
    BankOpcode,
    QuestOpcode,
    NotificationOpcode,
    ExperienceOpcode,
    NPCOpcode,
    TradeOpcode,
    EnchantOpcode,
    GuildOpcode,
    PointerOpcode,
    ShopOpcode,
    MinigameOpcode: {
        ...MinigameOpcode,
        TeamWarOpcode
    },
    RegionOpcode,
    OverlayOpcode,
    CameraOpcode,
    PushOpcode,
    CommandOpcode,
    ProfessionOpcode
} as const;
