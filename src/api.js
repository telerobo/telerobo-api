const express = require('express');
const router = express.Router();
const temperatures = require('./temperatures');
const warnings = require('./warnings');
const messagingResponse = require('twilio').twiml.MessagingResponse;

router.get('/ping', async (req, res) => {
    res.send("pong");
});

router.post('/check', async (req, res) => {
    let location = req.body.location;
    let alert = req.body.alert;
    res.send({
        acknowledged: warnings.acknowledged(location, alert)
    });
});

router.post('/receive', async (req, res) => {
    let response;
    let body = req.body.Body;

    if (body.match(/ok/i)) {
        let location = body
            .toLowerCase()
            .split('ok')
            .filter(s => s)
            .map(s => s.trim())
            .pop();
        warnings.remove(location);

        response = new messagingResponse();
        response.message(`Thank you for acknowledging ${location}`);
    } else if (body.match(/temperature/i)) {
        response = new messagingResponse();
        response.message(await temperatures.getMessage());
    }

    if (!response) {
        response = new messagingResponse();
        response.message(`Cannot understand request`);
    }

    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(response.toString());
});

router.post('/send', async (req, res) => {
    let location = req.body.location;
    let alert = req.body.alert;
    let parameters = req.body.parameters || [];

    let response = await warnings.push(location, alert, parameters);

    res.send(response);
});


router.post('/temperatures', async (req, res) => {
    await temperatures.set(req.body.adcValues);
    res.send("Successfully updated values");
});

module.exports = router;