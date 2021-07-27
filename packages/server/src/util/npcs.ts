export interface NPCData {
    key: string;
    id: number;
    name: string;
    text: string[];
    type: string;
}

export default {
    Properties: {} as { [name: string]: NPCData },
    Ids: {} as { [id: number]: NPCData },

    idToString(id: number): string {
        if (id in this.Ids) return this.Ids[id].key;

        return null;
    },

    idToName(id: number): string {
        if (id in this.Ids) return this.Ids[id].name;

        return null;
    },

    stringToId(name: string): number {
        if (name in this.Properties) return this.Properties[name].id;

        return null;
    },

    getText(id: number): string[] {
        if (id in this.Ids) return this.Ids[id].text;

        return null;
    },

    getType(id: number): string {
        if (id in this.Ids) return this.Ids[id].type;

        return null;
    }
};
