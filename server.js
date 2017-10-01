const _ = require('underscore');
const bearerToken = require('express-bearer-token');
const bodyParser = require('body-parser');
const Enigma = require('enigma-sim');
const express = require('express');

if (!process.env.BEARER_TOKEN) {
    console.log('No BEARER_TOKEN defined in environment');
    process.exit(1);
}

const app = express();
app.use(express.static(__dirname + '/public'));
app.use(bearerToken());
app.use(bodyParser.json());

const handleError = (res, reason, message, code) => {
    console.log("ERROR: " + reason);
    res.status(code || 500).json({"error": message});
};

const router = express.Router();

router.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to the Enigma SIM API.' });
});

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

// Initialize the app.
const server = app.listen(process.env.PORT || 8080, function () {
    const port = server.address().port;
    console.log("App now running on port", port);
});
