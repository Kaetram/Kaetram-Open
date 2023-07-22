import CraftingDe from './de/crafting';
import EnchantDe from './de/enchant';
import GuildsDe from './de/guilds';
import ItemDe from './de/item';
import MiscDe from './de/misc';
import ResourceDe from './de/resource';
import StoreDe from './de/store';
import TranslationDe from './de/translation';
import WarpsDe from './de/warps';
import CraftingEn from './en/crafting';
import EnchantEn from './en/enchant';
import GuildsEn from './en/guilds';
import ItemEn from './en/item';
import MiscEn from './en/misc';
import ResourceEn from './en/resource';
import StoreEn from './en/store';
import TranslationEn from './en/translation';
import WarpsEn from './en/warps';
import CraftingEs from './es/crafting';
import EnchantEs from './es/enchant';
import GuildsEs from './es/guilds';
import ItemEs from './es/item';
import MiscEs from './es/misc';
import ResourceEs from './es/resource';
import StoreEs from './es/store';
import TranslationEs from './es/translation';
import WarpsEs from './es/warps';
import CraftingFr from './fr/crafting';
import EnchantFr from './fr/enchant';
import GuildsFr from './fr/guilds';
import ItemFr from './fr/item';
import MiscFr from './fr/misc';
import ResourceFr from './fr/resource';
import StoreFr from './fr/store';
import TranslationFr from './fr/translation';
import WarpsFr from './fr/warps';
import CraftingRo from './ro/crafting';
import EnchantRo from './ro/enchant';
import GuildsRo from './ro/guilds';
import ItemRo from './ro/item';
import MiscRo from './ro/misc';
import ResourceRo from './ro/resource';
import StoreRo from './ro/store';
import TranslationRo from './ro/translation';
import WarpsRo from './ro/warps';
import CraftingRu from './ru/crafting';
import EnchantRu from './ru/enchant';
import GuildsRu from './ru/guilds';
import ItemRu from './ru/item';
import MiscRu from './ru/misc';
import ResourceRu from './ru/resource';
import StoreRu from './ru/store';
import TranslationRu from './ru/translation';
import WarpsRu from './ru/warps';

export let resources = {
    de: {
        crafting: CraftingDe,
        enchant: EnchantDe,
        guilds: GuildsDe,
        item: ItemDe,
        misc: MiscDe,
        resource: ResourceDe,
        store: StoreDe,
        translation: TranslationDe,
        warps: WarpsDe
    },
    en: {
        crafting: CraftingEn,
        enchant: EnchantEn,
        guilds: GuildsEn,
        item: ItemEn,
        misc: MiscEn,
        resource: ResourceEn,
        store: StoreEn,
        translation: TranslationEn,
        warps: WarpsEn
    },
    es: {
        crafting: CraftingEs,
        enchant: EnchantEs,
        guilds: GuildsEs,
        item: ItemEs,
        misc: MiscEs,
        resource: ResourceEs,
        store: StoreEs,
        translation: TranslationEs,
        warps: WarpsEs
    },
    fr: {
        crafting: CraftingFr,
        enchant: EnchantFr,
        guilds: GuildsFr,
        item: ItemFr,
        misc: MiscFr,
        resource: ResourceFr,
        store: StoreFr,
        translation: TranslationFr,
        warps: WarpsFr
    },
    ro: {
        crafting: CraftingRo,
        enchant: EnchantRo,
        guilds: GuildsRo,
        item: ItemRo,
        misc: MiscRo,
        resource: ResourceRo,
        store: StoreRo,
        translation: TranslationRo,
        warps: WarpsRo
    },
    ru: {
        crafting: CraftingRu,
        enchant: EnchantRu,
        guilds: GuildsRu,
        item: ItemRu,
        misc: MiscRu,
        resource: ResourceRu,
        store: StoreRu,
        translation: TranslationRu,
        warps: WarpsRu
    }
} as const;

export let ns = Object.keys(resources.en);
export let defaultNS = 'translation' as const;

export type Namespaces = typeof resources.en;

declare module 'i18next' {
    interface CustomTypeOptions {
        defaultNS: typeof defaultNS;
        returnNull: false;
        returnObjects: false;
    }
}
