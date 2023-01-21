import type { Db } from 'mongodb';

export default class Creator {
    public constructor(private database?: Db) {}
}
