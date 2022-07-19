import express from 'express';

import expressMongoRest from 'express-mongo-rest';

let app = express();

const router = expressMongoRest('mongodb://localhost:27017/kaetram_e2e');
app.use('/api/v1', router);

router.get('/health', (req, res) => {
    res.status(200).send('Ok');
});

let server = app.listen(3000, () => {
    console.log('Listening on Port', server.address());
});
