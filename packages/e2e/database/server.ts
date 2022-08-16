import express from 'express';
import bodyParser from 'body-parser';
import Handler from '@kaetram/e2e/database/handler';

interface MongoRestParams {
    collectionName: string;
    username: string;
}

let handler = new Handler(),
    app = express();

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

let router = express.Router();

router.get('/health', (req, res) => {
    res.status(200).send('Ok');
});

router.post<MongoRestParams>('/:collectionName/username/:username', (req, res) => {
    let { collectionName, username } = req.params;
    handler.upsert(collectionName, username, req.body, (error) => res.end());
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
        if (error) console.log(`Collection cannot be dropped [${collectionName}]`);

        res.end();
    });
});

app.use('/api/v1', router);

let server = app.listen(3000, () => {
    console.log('Listening on Port', server.address());
});
