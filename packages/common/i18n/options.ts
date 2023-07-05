import TranslationEn from './en/translation';
import StoreEn from './en/store';
import MiscEn from './en/misc';
import CraftingEn from './en/crafting';
import WarpsEn from './en/warps';
import GuildsEn from './en/guilds';
import EnchantEn from './en/enchant';
import TranslationRo from './ro/translation';
import StoreRo from './ro/store';
import MiscRo from './ro/misc';
import CraftingRo from './ro/crafting';
import WarpsRo from './ro/warps';
import GuildsRo from './ro/guilds';
import EnchantRo from './ro/enchant';

export let resources = {
    en: {
        translation: TranslationEn,
        store: StoreEn,
        misc: MiscEn,
        crafting: CraftingEn,
        warps: WarpsEn,
        guilds: GuildsEn,
        enchant: EnchantEn
    },
    ro: {
        translation: TranslationRo,
        store: StoreRo,
        misc: MiscRo,
        crafting: CraftingRo,
        warps: WarpsRo,
        guilds: GuildsRo,
        enchant: EnchantRo
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
