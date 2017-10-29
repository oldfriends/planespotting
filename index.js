const geolib = require("geolib");
const rp = require("request-promise-native");
const db = require("./lib/db");

const seen = {};

const CENTER = {
    latitude: 37.8073,
    longitude: -122.2580
};

const RADIUS = 10000;

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

    if (seen[hex] && (new Date()) - seen[hex].time < 4 * 60 * 60 * 1000) {
        return;
    }

    seen[hex] = {
        time: (new Date())
    };

    type = db.getMakeForHex(hex);

    console.log(`${new Date().toISOString()}: ${(hex).trim()} ${type} ${distance}`);
};

const runLoop = async () => {
    const flights = await getFlights();
    const flightsInRange = flights.aircraft.filter(inRange);
    flightsInRange.map(logFlight);
    setTimeout(runLoop, 60000);
};

runLoop();

