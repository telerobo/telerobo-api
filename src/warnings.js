const config = require('./config');
const twilio = require('twilio');

class Warnings {
    constructor() {
        this.index = {};
        this.scanner = {};
        this.client = new twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
    }

    startScan(key) {
        if (!this.scanner[key]) {
            this.scanner[key] = setInterval((key) => this.scan(key), process.env.SCAN_INTERVAL_MINUTES * 60 * 1000);
        }

        this.scan(key);
    }

    stopScan(key) {
        clearInterval(this.scanner[key]);
        delete this.scanner[key];
    }

    scan(key) {
        console.log(`Scanning key '${key}'`);

        let message = this.index[key].message;
        let recipients = this.index[key].recipients;
        let round = this.index[key].round;
        let to = this.index[key].recipients[round % recipients.length];

        try {
            this.client.messages.create({
                body: message,
                to: to,
                from: `${process.env.TWILIO_NUMBER}`
            });
            console.debug(`Successfully called ${to}`);
        } catch (err) {
            console.debug(`Failed to call ${to}`);
        }

        console.debug(`Incremented ${key} to ${this.index[key]}`);
        this.index[key].round++;
    }

    async push(location, alert, parameters) {
        let key = location + alert;
        if (!this.index.hasOwnProperty(key)) {
            this.index[key] = {
                round: 0,
                recipients: await config.getRecipients(location, alert),
                message: await config.getMessage(location, alert, parameters),
            };

            this.startScan(key);

            return this.index[location + alert];
        } else {
            return {};
        }
    }

    remove(location) {
        Object.keys(this.index).forEach((key) => {
            if (key.startsWith(location)) {
                console.debug(`Removed ${key}`);
                this.stopScan(key);
                delete this.index[key];
            }
        });
    }

    acknowledged(location, alert) {

    }
}

module.exports = new Warnings();