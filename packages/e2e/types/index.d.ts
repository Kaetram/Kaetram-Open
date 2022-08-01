declare module 'express-mongo-rest' {
    import type { Application } from 'express';

    export default function expressMongoRest(url: string): Application;
}
