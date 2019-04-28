const gsheet = require('google-spreadsheet');
const util = require('util');

class Config {
    constructor(spreadsheetId, clientEmail, privateKey) {
        this.spreadsheetId = spreadsheetId;
        this.clientEmail = clientEmail;
        this.privateKey = privateKey;
    }

    async fetchSheet() {
        // Prepare sheet
        let sheet = new gsheet(this.spreadsheetId);

        const useServiceAccountAuth = util.promisify(sheet.useServiceAccountAuth.bind(this));
        const getInfo = util.promisify(sheet.getInfo.bind(this));

        await useServiceAccountAuth({ client_email:this.clientEmail, private_key:this.privateKey });
        let sheetInfo = await getInfo();

        return sheetInfo.worksheets[0];
    }

    async getRows() {
        let sheet = await this.fetchSheet();
        const getRows = util.promisify(sheet.getRows.bind(this));
        const getCells = util.promisify(sheet.getCells.bind(this));
        let rows = await getRows({});
        await getCells({
            'min-row': 1,
            'max-row': 1,
            'return-empty': true
        });
        return rows;
    }

    async findRow(location, alert) {
        let rows = await this.getRows();
        let result = {};
        rows.forEach((row) => {
            if (row.location === location && row.alert === alert) {
                result = row;
                return false;
            }
        });
        return result;

    }

    async getRecipients(location, alert) {
        let row = await this.findRow(location, alert);
        return row.recipients.split("\\n");
    }

    async getMessage(location, alert, parameters) {
        let row = await this.findRow(location, alert);
        return util.format(row.message, ...parameters);
    }
}

module.exports = new Config(
    process.env.GOOGLE_SPREADSHEET_ID,
    process.env.GOOGLE_CLIENT_EMAIL,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
);