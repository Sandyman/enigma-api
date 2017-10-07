const _ = require('underscore');
const express = require('express');
const Enigma = require('enigma-sim');
const memjs = require('memjs');
const id = require('../lib/id');
const handleError = require('../lib/handle-error');

/**
 * Connect to memcache
 */
const cache = memjs.Client.create(process.env.MEMCACHEDCLOUD_SERVERS, {
    username: process.env.MEMCACHEDCLOUD_USERNAME,
    password: process.env.MEMCACHEDCLOUD_PASSWORD
});

const COLLECTION = 'enigmas';

let db;

const router = express.Router();

/**
 * Just a simple message for the root path
 */
router.get('/', (req, res) => res.status(200).json({ message: 'Welcome to the Enigma SIM API Version 2.' }));

/**
 * Creates a new Enigma object
 */
router.post('/enigma', (req, res) => {
    const config = req.body;
    try {
        const enigma = new Enigma(config);

        db.collection(COLLECTION).insertOne(config, (err, result) => {
            if (err) return res.status(500).json({ errors: 'Could not create object in database' });

            const cfg = result.ops[0];
            cfg._id = id.encode(cfg._id);
            cache.set(cfg._id, enigma);
            return res.status(201).json(cfg);
        });
    } catch (e) {
        return handleError(res, 'Enigma error', e.message, e.code);
    }
});

/**
 * Get Enigma object by id
 */
router.get('/enigma/:id', (req, res) => {
    const enigmaId = id.decode(req.params.id);
    db.collection(COLLECTION).findOne({ _id: enigmaId }, (err, doc) => {
        if (err) return handleError(res, 'Database error', 'Unable to retrieve object', 500);
        if (!doc) return handleError(res, 'Database error', 'Could not find object', 404);

        const enigma = doc;
        console.log(enigma);
        enigma._id = id.encode(enigma._id);
        return res.status(200).json(enigma);
    });
});

/**
 * Update Enigma object configuration
 */
router.put('/enigma/:id', (req, res) => {
    const enigmaId = id.decode(req.params.id);
    const updateDoc = req.body;
    delete updateDoc._id;

    try {
        const enigma = new Enigma(updateDoc);

        return db.collection(COLLECTION).updateOne({ _id: enigmaId }, updateDoc, (err, doc) => {
            if (err) return handleError(res, 'Database error', 'Unable to update object', 500);
            if (!doc) return handleError(res, 'Database error', 'Could not find object', 404);

            updateDoc._id = req.params.id;
            cache.set(updateDoc._id, enigma);
            res.status(200).json(updateDoc);
        });
    } catch (e) {
        return handleError(res, 'Enigma error', e.message, e.code);
    }
});

/**
 * Encode a message
 */
router.post('/enigma/:id/encode', (req, res) => {
    const { message, rotors } = req.body;
    if (!message) return handleError(res, 'Missing information', 'Body contains no message');
    if (!rotors) return handleError(res, 'Missing information', 'Body contains no rotors');

    let enigma;
    const enigmaId = id.decode(req.params.id);
    cache.get(req.params.id, (err, value, key) => {
        if (value !== null) {
            enigma = value;
            const result = enigma.onMessage(rotors, message);
            return res.status(200).json({ result });
        }

        // Not found in cache, so retrieve configuration from database
        return db.collection(COLLECTION).findOne({ _id: enigmaId }, (err, doc) => {
            if (err) return handleError(res, 'Database error', 'Could not find object', 400);

            try {
                enigma = new Enigma(doc);
                const result = enigma.onMessage(rotors, message);
                return res.status(200).json({ result });
            } catch (e) {
                return handleError(res, 'Enigma error', e.message, e.code);
            }
        });
    });
});

/**
 * Delete an Enigma object
 */
router.delete('/enigma/:id', (req, res) => {
    const enigmaId = id.decode(req.params.id);
    db.collection(COLLECTION).deleteOne({ _id: enigmaId }, (err, data) => {
        if (err) console.log(`Error deleting: ${err.message}`);
        else console.log(`Successfully deleted ${data.deletedCount} objects`);
    });
    return res.status(202).json(req.params.id);
});

/**
 * Get a router after storing database handle
 * @param database
 * @returns {*}
 */
const getRouter = (database) => {
    db = database;
    return router;
};

module.exports = getRouter;
