import type { Db } from 'mongodb';

export default class Loader {
    public constructor(private database?: Db) {}
}
