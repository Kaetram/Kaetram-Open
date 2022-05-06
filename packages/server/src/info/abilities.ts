export interface AbilitiesData {
    key: string;
    id: number;
    type: string;
    mana: number | number[];
    cooldown: number[];
}

export default {
    Data: {} as { [key: string]: AbilitiesData },
    Ids: {} as { [id: number]: AbilitiesData }
};
