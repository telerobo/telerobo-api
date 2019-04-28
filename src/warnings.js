const config = require('./config');
const twilio = require('twilio');

class Warnings {
    constructor() {
        this.index = {};
        this.client = new twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

    }

    startScan() {
        if (!this.scanner) {
            this.scanner = setInterval(this.scan.bind(this), 30 * 1000);
        }

        this.scan();
    }

    stopScan() {
        clearInterval(this.scanner);
        this.scanner = null;
    }

    scan() {
        Object.keys(this.index).forEach((key) => {
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
        });
    }

    async push(location, alert, parameters) {
        let key = location + alert;
        if (!this.index.hasOwnProperty(key)) {
            this.index[key] = {
                round: 1,
                recipients: await config.getRecipients(location, alert),
                message: await config.getMessage(location, alert, parameters),
            };

            this.startScan();

            return this.index[location + alert];
        } else {
            return {};
        }
    }

    remove(location) {
        Object.keys(this.index).forEach((key) => {
            if (key.startsWith(location)) {
                console.debug(`Removed ${key}`);
                delete this.index[key];
            }
        });

        if (Object.entries(this.index).length === 0) {
            this.stopScan();
        }
    }

    acknowledged(location, alert) {

    }
}

module.exports = new Warnings();