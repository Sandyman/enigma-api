const mongodb = require('mongodb');
const Monguscate = require('monguscate');

const ObjectID = mongodb.ObjectID;

const O = new Monguscate();

const encode = (s) => {
    const t = O.obfuscate(s.toString());
    return `${t.substr(0, 8)}-${t.substr(8, 4)}-${t.substr(12, 4)}-${t.substr(16)}`;
};

const decode = (s) => new ObjectID(O.obfuscate(s.replace(/-/g, '')));

module.exports = {
    decode,
    encode,
};
