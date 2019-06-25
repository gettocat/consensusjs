module.exports = function (app) {

    class Data extends app.MODULE {

        constructor(data) {
            super();
            this.data = data;
        }

        static IsDataMessage(message) {
            if (message[app.DATA.getIdFieldName()]
                && message[app.DATA.getPrevIdFieldName()]
                && message[app.DATA.getTimeFieldName()]
                && message[app.DATA.getBitsFieldName()])
                return true;
            return false;
        }

        static getVersionFieldName() {
            return 'version';
        }

        static getIdFieldName() {
            return 'id';
        }

        static getPrevIdFieldName() {
            return 'previd';
        }

        static getTimeFieldName() {
            return 'time';
        }

        static getBitsFieldName() {
            return 'bits';
        }
        getVersion() {
            return this.data[app.DATA.getVersionFieldName()] || 1;
        }
        getId() {
            return this.data[app.DATA.getIdFieldName()];
        }
        getBits() {
            return this.data[app.DATA.getBitsFieldName()];
        }
        getPrevId() {
            return this.data[app.DATA.getPrevIdFieldName()];
        }
        getKey() {
            return this.data.tx[0].key;
        }
        getTime() {
            return this.data[app.DATA.getTimeFieldName()];
        }

        isValid() {

            if (this.getId())
                return true;

            return false;

        }

        /**
         * Check that data is for consensus module
         */
        isImportant() {

            if (this.getId())
                return true;

            return false;

        }

        /**
         * Get stake value of sender this data. 
         * @param {*} height 
         */
        getStakeValue(height) {
            //this method only for proof of stake consensus
            //public key = this.getKey();
            //get from blockchain outs for key 
            return 0;
        }


        /**
         * Check data.getKey() for delegates, if consensus in delegateMode and check dynamic delegates here.
         */
        isDelegateMessage() {
            let delegates = app.config[app.consensus_name].delegates;
            let key = this.getKey();
            if (delegates instanceof Array) {
                if (delegates.indexOf(key) >= 0)
                    return true;
                return false;
            }

            return false;
        }

    }

    return Data;

}