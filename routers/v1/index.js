const _ = require('underscore');
const express = require('express');
const Enigma = require('enigma-sim');
const handleError = require('../lib/handle-error');
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

module.exports = router;
