module.exports = function (app) {

    class DelegatedProofOfStakeConsensus extends app.CONSENSUS.ProofOfStakeConsensus {
        constructor(consensus_name, consensus_config_field) {
            if (!consensus_config_field)
                super('Delegated Proof of Stake', 'dpos');
            else
                super(consensus_name, consensus_config_field);
        }
        /**
         * Delegates can be static and dynamic. This file about static delegates, dynamic in dynamic-dpow(s)
         * @param PEER peer 
         */
        isDataMatch(data, peer) {
            if (this.getConfig('delegateMode')) {//new block can emit more then 1 node:
                return this.getConfig('delegates').indexOf(data.getKey()) >= 0 || data.isDelegateMessage();
            }
        }
    }

    return DelegatedProofOfStakeConsensus

}