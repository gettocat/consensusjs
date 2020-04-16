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
        static getNonceFieldName(){
            return 'nonce';
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
        getNonce(){
            return this.data[app.DATA.getNonceFieldName()];
        }
        getPrevId() {
            return this.data[app.DATA.getPrevIdFieldName()];
        }
        getKey() {
            return this.data.tx[0].key;
        }
        getValidatorsMerkle() {
            return '';//only for ddpos
        }
        getValidators() {
            let keys = [];
            for (let i in this.data.tx[0].out) {
                if (this.data.tx[0].out[i].key)
                    keys.push(this.data.tx[0].out[i].key);
            }
            return keys;
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

        emit() {
            //emit this data + tx list
            app.emit("app.data" + this.getId());
            if (this.tx && this.tx.length > 0)
                for (let i in this.tx) {
                    if (this.tx[i] && this.tx[i].id)
                        app.emit("app.data.tx" + this.tx[i].id);
                }
        }

    }

    return Data;

}