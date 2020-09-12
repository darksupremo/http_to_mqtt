require('dotenv').config()
const mqtt = require('mqtt');
const app = require('express')();
const bodyParser = require('body-parser');

const settings = {
    mqtt: {
        host: process.env.MQTT_HOST || 'mqtt://test.mosquitto.org',
        user: process.env.MQTT_USER || '',
        password: process.env.MQTT_PASS || '',
        clientId: process.env.MQTT_CLIENT_ID || null
    },
    debug: process.env.DEBUG_MODE || false,
    api_key: process.env.API_KEY || '',
    http_port: process.env.PORT || 5000
}



function getMqttClient() {

    const options = {
        username: settings.mqtt.user,
        password: settings.mqtt.password
    };

    if (settings.mqtt.clientId) {
        options.clientId = settings.mqtt.clientId
    }

    return mqtt.connect(settings.mqtt.host, options);
}

const mqttClient = getMqttClient();

app.set('port', settings.http_port);
app.use(bodyParser.json());
app.use(logRequest);
app.use(parseParameters);
app.use('/publish/:topic?/:message?', parseParameters);
app.use('/subscribe/:topic?', parseParameters);
app.use(authorizeUser);
app.use(ensureTopicSpecified);

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});

app.get('/publish/:topic?/:message?', ((req, res) => {
    mqttClient.publish(req.body.topic, req.body.message || "");
    res.sendStatus(200);
}));

app.post('/publish', ((req, res) => {
    mqttClient.publish(req.body.topic, req.body.message || "");
    res.sendStatus(200);
}));

app.get('/subscribe/:topic?', (req, res) => {
    const topic = req.body.topic;
    const mqttClient = getMqttClient();

    mqttClient.on('connect', function () {
        mqttClient.subscribe(topic);
    });

    mqttClient.on('message', function (t, m) {
        res.write(m);
    });

    req.on("close", function () {
        mqttClient.end();
    });

    req.on("end", function () {
        mqttClient.end();
    });
});

function logRequest(req, res, next) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    let message = `Received request [${req.originalUrl}] from [${ip}]`;
    if (settings.debug) {
        message += ` with payload [${JSON.stringify(req.body)}]`;
    }

    console.log(message);

    next();
}

function authorizeUser(req, res, next) {
    if (settings.api_key && req.body.api_key !== settings.api_key) {
        console.warn('Request is not authorized.');
        res.sendStatus(401);
    }
    else {
        next();
    }
}

function parseParameters(req, res, next) {
    if (req.query.topic || req.params.topic) {
        req.body.topic = req.query.topic || req.params.topic;
    }
    if (req.query.message || req.params.message) {
        req.body.message = req.query.message || req.params.message;
    }
    if (req.query.api_key || req.params.api_key || req.headers.api_key) {
        req.body.api_key = req.query.api_key || req.params.api_key || req.headers.api_key;
    }
    next();
}

function ensureTopicSpecified(req, res, next) {
    if (!req.body.topic) {
        res.status(500).send('Topic not specified');
    }
    else {
        next();
    }
}
