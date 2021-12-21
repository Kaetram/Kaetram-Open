export interface ObjectsData {
    id?: string;
    x: number;
    y: number;
    type: string;
    messages: string[];
    cursor: string;
}

export default {
    Data: {} as { [id: string]: ObjectsData },

    getObject(id: string): ObjectsData | null {
        if (id in this.Data) return this.Data[id];

        return null;
    },

    getPosition(id: string): Pos {
        let info = id.split('-');

        return {
            x: parseInt(info[0]),
            y: parseInt(info[1])
        };
    },

    getCursor(id: string): string | undefined {
        if (id in this.Data && this.Data[id].cursor) return this.Data[id].cursor;
    }
};
