import log from '@kaetram/common/util/log';
import Handler from '@kaetram/e2e/database/handler';
import express from 'express';

interface MongoRestParams {
    collectionName: string;
    username: string;
}

let handler = new Handler(),
    app = express();

app.use(express.urlencoded());
app.use(express.json());

let router = express.Router();

router.get('/health', (req, res) => {
    res.status(200).send('Ok');
});

router.post<MongoRestParams>('/:collectionName/username/:username', (req, res) => {
    let { collectionName, username } = req.params;
    handler.upsert(collectionName, username, req.body, () => res.end());
});

router.delete<MongoRestParams>('/:collectionName/username/:username', (req, res) => {
    let { collectionName, username } = req.params;
    handler.delete(collectionName, username, () => res.end());
});

router.get<MongoRestParams>('/:collectionName/username/:username', (req, res) => {
    let { collectionName, username } = req.params;
    handler.getByUsername(collectionName, username, (entities) =>
        res.end(JSON.stringify(entities))
    );
});

router.delete<MongoRestParams>('/:collectionName', (req, res) => {
    let { collectionName } = req.params;
    handler.deleteCollection(collectionName, (error) => {
        if (error) log.error(`Collection cannot be dropped [${collectionName}]`);

        res.end();
    });
});

app.use('/api/v1', router);

let server = app.listen(3000, () => {
    log.notice('Listening on Port', server.address());
});
