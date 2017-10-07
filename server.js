const bearerToken = require('express-bearer-token');
const bodyParser = require('body-parser');
const express = require('express');
const mongodb = require('mongodb');
const routerV1 = require('./routers/v1');
const routerV2 = require('./routers/v2');

const ObjectID = mongodb.ObjectID;
const MongoClient = mongodb.MongoClient;
if (!process.env.BEARER_TOKEN) {
    console.log('No BEARER_TOKEN defined in environment');
    process.exit(1);
}

let db;

const app = express();
app.use(express.static(__dirname + '/public'));
app.use(bearerToken());
app.use(bodyParser.json());

// Connect to MongoDB
MongoClient.connect(process.env.MONGODB_URI, (err, database) => {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    db = database;
    console.log('Database connection ready');

    // Initialize the app.
    const server = app.listen(process.env.PORT || 8080, () => {
        const port = server.address().port;
        console.log("App now running on port", port);
    });

    app.use('/v1', routerV1);
    app.use('/v2', routerV2(db));
});
