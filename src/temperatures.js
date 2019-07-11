const redis = require("redis");
const {promisify} = require('util');

class Temperatures {
    constructor() {
        this.client = redis.createClient({ url: process.env.REDIS_URL });
        this.setAsync = promisify(this.client.set).bind(this.client);
        this.getAsync = promisify(this.client.get).bind(this.client);
    }

    async set(values) {
        try {
            await this.setAsync('info', values);
            console.log(`Successfully set infos.`);
        } catch (e) {
            console.error(`Failed to set infos.`, e);
        }
    }

    async get() {
        try {
            let data = await this.getAsync('info');
            console.log(`Successfully retrieved infos.`);
            return data;
        } catch (e) {
            console.error(`Failed to retrieve infos.`, e);
        }
    }

    async getMessage() {
        let values = (await this.get()).split(',');
        let formattedValues = values.map((value, index) => {
            return `${Temperatures.getValueKey(index)}: ${value}°C`;
        });
        return formattedValues.join("\n");
    }

    static getValueKey(index) {
        let key;
        switch(index) {
            default:
                key = `Temperature ${index + 1}: `;
                break;
        }

        return key;
    }
}

module.exports = new Temperatures();