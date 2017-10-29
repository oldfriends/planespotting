const fs = require("fs");
const path = require("path");
const lodash = require("lodash");

const db = require("../planes.json");

const getMakeForHex = (hex) => {
    if (db[hex]) {
        return db[hex].t || "";
    }
    return "";
};

const loadLetter = (letter) => {
    const p = path.resolve(__dirname, '../', 'db', `${letter}.json`);
    const d = JSON.parse(fs.readFileSync(p));
    const children = d.children || [];
    delete d.children;
    Object.assign(db, lodash.mapKeys(d, (v, k) => `${letter}${k}`));
    children.forEach(loadLetter);
}

module.exports = {
    getMakeForHex,
    loadLetter
};
