const BN = require('bn.js');

module.exports = function (app) {

    class dynamicDelegateProofOfStakeConsensus extends app.CONSENSUS {

        constructor(consensus_name, consensus_config_field) {
            if (!consensus_config_field)
                super('Delegated Proof of Stake', 'ddpos');
            else
                super(consensus_name, consensus_config_field);
        }
        /**
         * In this method we can check ability of peer to send data in network
         * return true is yes, else false.
         */
        isPeerCanSendData(peer) {
            //one of validator list
            //this peer have cursor
            if (app.dataManager.getHeight() == -1)
                return true;//genesis
            return this.isDelegateMode() ? this.getConfig('delegates').indexOf(peer.getId()) != -1 : app.roundManager.isActiveValidator(peer.getId());
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
            //check data for consensus
            if (app.dataManager.getHeight() == -1 && data.getId() == app.config.genesis.id)
                return true;
            if (this.isDelegateMode()) {
                return this.getConfig('delegates').indexOf(data.getKey()) != -1
            } else {
                return app.roundManager.isActiveValidator(data.getKey());
            }
        }
        /**
         * In this mode only delegate node can send data to network
         */
        isDelegateMode() {
            return app.roundManager.validatorCount() < this.getConfig('staticDelegatesLimit');//use delegates from config if havent N nodes
        }

        applyData(peer, data) {
            let round = true;
            if (!this.isDelegateMode())
                round = app.roundManager.check(peer, data);

            if (!round)
                throw new Error('Key of this validator havent cursor');

            let res = false;
            res = super.applyData(peer, data);

            if (res && !this.isDelegateMode())
                app.roundManager.update();

            return res;
        }

        addValidator(publickey, priority, volume) {
            this.debug('debug', 'add validator ' + publickey + ' with priority ' + priority + ' and volume ' + volume);
            app.roundManager.addValidator(publickey, priority, volume)
        }

    }

    return dynamicDelegateProofOfStakeConsensus;
}

