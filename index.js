const geolib = require("geolib");
const rp = require("request-promise-native");
const db = require("./lib/db");
const mustache = require("mustache");
const fs = require("fs");
const path = require("path");
const template = fs.readFileSync("template.md", "utf8");
const strftime = require("strftime");

const seen = {};

const CENTER = {
    latitude: 37.8073,
    longitude: -122.2580
};

const RADIUS = 20000;

const getFlights = () => {
    return rp.get("http://10.0.0.26:8080/data/aircraft.json", {
        json: true
    });
};

const inRange = (flight) => {
    if (!flight.lat || !flight.lon) {
        return false;
    }

    return geolib.isPointInCircle(
        {latitude: flight.lat, longitude: flight.lon},
        CENTER,
        RADIUS
    );
};

const isUnseen = (flight) => {
    let hex = flight.hex.toUpperCase();
    if (hex[0] === "~") {
        hex = hex.substr(1);
    }

    if (seen[hex] && (new Date()) - seen[hex].time < 4 * 60 * 60 * 1000) {
        return false;
    }

    return true;
};

const logFlight = (flight) => {
    const distance = geolib.getDistance(
        CENTER,
        {latitude: flight.lat, longitude: flight.lon}
    );
    let type = "";
    let hex = flight.hex.toUpperCase();
    if (hex[0] === "~") {
        hex = hex.substr(1);
    }
    seen[hex] = {
        time: (new Date())
    };

    type = db.getMakeForHex(hex);

    if (type.length) {
        const filename = `${strftime("%Y-%m-%d")}-${type}-${hex}.md`;
        const title = `Spotted: ${type}`;
        const date = strftime("%Y-%m-%d %I:%M %p");
        const output = mustache.render(template, {
            title,
            date,
            type
        });
        fs.writeFileSync(path.resolve("out", filename), output);
    }
    console.log(`${new Date().toISOString()}: ${(hex).trim()} ${type} ${distance}`);
};

const runLoop = async () => {
    const flights = await getFlights();
    const flightsInRange = flights.aircraft.filter(inRange);
    const chosenFlight = flightsInRange.find(isUnseen);
    if (chosenFlight) {
        logFlight(chosenFlight);
    }
    setTimeout(runLoop, 60000);
};

runLoop();

