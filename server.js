const _ = require('underscore');
const bearerToken = require('express-bearer-token');
const bodyParser = require('body-parser');
const Enigma = require('enigma-sim');
const express = require('express');
const mongodb = require('mongodb');

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
});

/**
 * Log error and return with provided status code or 500
 * @param res
 * @param reason
 * @param message
 * @param code
 */
const handleError = (res, reason, message, code) => {
    console.log("ERROR: " + reason);
    res.status(code || 500).json({"error": message});
};

// Create router
const router = express.Router();

// Just a simple message for the root path
router.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to the Enigma SIM API.' });
});

// A POST endpoint for encoding a message
router.post('/encode', (req, res) => {
    if (req.token !== process.env.BEARER_TOKEN) {
        return handleError(res, 'Authorisation Failed', 'Header does not contain a Bearer Token', 401);
    }

    const body = req.body;

    if (_.isEmpty(body)) {
        return handleError(res, 'Missing Information', 'Body contains no useful information', 400);
    }
    if (_.isEmpty(body.settings)) {
        return handleError(res, 'Missing Information', 'You must provide settings', 400);
    }
    if (_.isEmpty(body.message)) {
        return handleError(res, 'Missing Information', 'There is no message to encode', 400);
    }

    try {
        const enigma = new Enigma(body.settings);
        const result = enigma.onMessage(body.message);
        const response = {
            message: body.message,
            encodedMessage: result,
        };
        res.status(200).json(response);
    } catch (e) {
        return handleError(res, '', e.message, e.code);
    }
});

app.use('/v1', router);
