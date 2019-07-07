const express = require('express');
const router = express.Router();
const infos = require('./infos');
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

    if (body.match(/ok/)) {
        let location = body
            .toLowerCase()
            .split('ok')
            .filter(s => s)
            .map(s => s.trim())
            .pop();
        warnings.remove(location);

        response = new messagingResponse();
        response.message(`Thank you for acknowledging ${location}`);
    } else if (body.match(/info/)) {
        response = new messagingResponse();
        response.message(await infos.getMessage());
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


router.post('/info', async (req, res) => {
    let response = await infos.set(req.body.adcValues);
    res.send(response);
});

module.exports = router;