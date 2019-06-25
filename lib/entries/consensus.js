module.exports = function (app) {

    class AbstractConsensus extends app.MODULE {

        constructor(consensus_name, consensus_config_field) {
            super();

            if (!app.config[consensus_config_field] || Object.keys(app.config[consensus_config_field]).length < 1)
                throw new Error('For ' + consensus_name + ' consensus must exist "' + consensus_config_field + '" section in config.');

            this.config = this.extendConfig(consensus_config_field);
            this.consensus_name = consensus_name;
            this.consensus_config_field = consensus_config_field;
        }
        extendConfig(name) {

            let tree = [];
            let next = name;

            do {
                let parent = app.config[next];
                if (parent && tree.indexOf(next) === -1) {
                    tree.unshift(next);
                    let prevkey = next;
                    next = parent.extends;

                    if (next && (!app.config[next] || Object.keys(app.config[next]) < 1))
                        throw new Error("Extending " + prevkey + " with parent: " + next + " is failed, parent config section is not exist");

                } else
                    next = false;
            } while (next);

            let cnf = [];
            for (let i in tree) {
                cnf = Object.assign(cnf, app.config[tree[i]]);
            }

            cnf._extendsTree = tree;
            return cnf;
        }
        getConfig(field, defaultValue) {
            return field ? (this.config[field] ? this.config[field] : defaultValue) : this.config;
        }
        init() {

            let info = app.dataManager.getTopInfo();
            this.topDataId = info[app.DATA.getIdFieldName()];
            this.topDataHeight = info.height;

        }
        applyData(peer, data) {

            if (!data.isImportant())
                return false;

            if (!this.isPeerCanSendData(peer))
                throw new Error("Peer can not send data");

            if (!data.isValid())
                throw new Error('Invalid data');

            if (!this.isDataMatch(data, peer))
                throw new Error('Data is not match to consensus');

            if (this.isDelegateMode() && (!data.isDelegateMessage(data)))
                throw new Error('Data is not match to consensus, is not delegate message');

            return app.dataManager.addData(data);
        }
        /**
         * In this method we can check ability of peer to send data in network
         * return true is yes, else false.
         */
        isPeerCanSendData(peer) {
            return true;
        }
        /**
         *Check that data is match to consensus.
         For centralized: match all data, sended from mainNode.
         For delegate proof: match all data, sended from delegate
         For PoW: match data, difficulty > avgDifficultyNetwork
         etc
         * return true if yes, else false.
         */
        isDataMatch(data, peer) {
            return true;
        }
        /**
         * In this mode only delegate node can send data to network
         */
        isDelegateMode() {
            return !!this.getConfig('delegateMode')
        }

        /**
         * Check that hash is valid for this target
         * @param {*} hash 
         * @param {*} target 
         */
        checkHash(hash, target) {
            return true;
        }

    }

    return AbstractConsensus;

}