module.exports = function (app) {

    class AbstractConsensus extends app.MODULE {

        constructor(consensus_name, consensus_config_field) {
            super();

            if (!app.config[consensus_config_field] || Object.keys(app.config[consensus_config_field]).length < 1)
                throw new Error('For ' + consensus_name + ' consensus must exist "' + consensus_config_field + '" section in config.');

            this.config = this.extendConfig(consensus_config_field);
            this.consensus_name = consensus_name;
            this.consensus_config_field = consensus_config_field;

            this.emit("app.consensus.create", { name: this.consensus_name, field: this.consensus_config_field, config: this.config });
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
            this.emit("app.consensus.init", {
                id: this.topDataId,
                height: info.height
            });

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

            let consensus_version = this.inConsensusVersionRange(data);

            if (!consensus_version.result)
                throw new Error('Data version is not match to consensus: ' + consensus_version.message);

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

        inConsensusVersionRange(data) {

            //get data height
            //if not - check parent height + 1
            //if have - 
            ////check forks and 
            let height = app.dataManager.getDataHeight(data.getId());
            if (!height) {//check parent
                height = app.dataManager.getDataHeight(data.getPrevId());
            }

            if (height) {
                let list = this.getForks();
                let top = this.getDataHeight;
                let lastHard = 0;
                for (let k in list) {
                    if (!list[k])
                        continue;

                    if (k >= height)
                        break;

                    if (list[k].isHard == true) {
                        lastHard = k;
                    }

                }

                let nearSoft = lastHard;
                for (let k in list) {
                    if (!list[k])
                        continue;

                    if (k > height)
                        break;

                    if (!list[k].isHard)
                        nearSoft = k;
                }

                let height_range = [
                    lastHard, nearSoft
                ];

                let verson_range = [
                    list[lastHard].version,
                    list[nearSoft].version,
                ];

                let msg = "";
                if (!(data.getVersion() >= verson_range[0] && data.getVersion() <= verson_range[1])) {
                    if (verson_range[0] == verson_range[1])
                        msg = "Version of block must be equal " + verson_range[0] + " at height " + height;
                    else
                        msg = "Version of block must be between " + verson_range[0] + " and " + verson_range[1] + " at height " + height;
                }


                return {
                    heights: height_range,
                    range: verson_range,
                    result: data.getVersion() >= verson_range[0] && data.getVersion() <= verson_range[1],
                    message: msg
                }
            }

            return {//side or orphan
                result: true
            }

        }

        getForks() {
            let forks = app.config[app.consensus_name]['forks'];
            if (!forks)
                return {
                    '0': { isHard: true, version: 1 }
                }

            if (!forks['0'] || !forks['0'].isHard)
                forks['0'] = { isHard: true, version: 1 };

            return forks;
        }

    }

    return AbstractConsensus;

}