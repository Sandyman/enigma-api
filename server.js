const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongodb = require('mongodb');

const ObjectID = mongodb.ObjectID;
const MongoClient = mongodb.MongoClient;

const app = express();
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json);

let db;

MongoClient.connect(process.env.MONGODB_URI, (err, database) => {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    db = database;
    console.log('Database connection ready');

    const server = app.listen(process.env.PORT || 8080, () => {
        const port = server.address().port;
        console.log(`App now running on port ${port}`);
    });
});
