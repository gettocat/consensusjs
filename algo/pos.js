module.exports = function (app) {

    class ProofOfStakeConsensus extends app.CONSENSUS.ProofOfWorkConsensus {
        constructor(consensus_name, consensus_config_field) {
            if (!consensus_config_field)
                super('Proof of Stake', 'pos');
            else
                super(consensus_name, consensus_config_field);
        }
        isDataMatch(data, peer) {
            let h = app.dataManager.getHeight();
            let a = this.checkHash(data.getId(), data.getBits());
            let diff = this.next_network_target(data.getKey(), data.getStakeValue(h), h);
            let b = data.getBits() == diff;
            return a
                && b;
        }
        next_network_target(publicKey, stakeValue, height) {
            let target = super.next_network_target(height);
            if (!stakeValue)
                return target;

            return this.getStakeToTargetTransform(publicKey, stakeValue, target);
        }
        getStakeToTargetTransform(publicKey, stake, target) {
            //make some algo, to change target, if stakeValue is not null
            //if user have make coins - target must be lower
            //by default kust decrease diff on 10%, nut we can calculate usercoins/allcoins value, and use this param instead shareStake
            return (stake > 0) ? target * (1 - this.getConfig('shareStake', 0.1)) : target;
        }
    }

    return ProofOfStakeConsensus;
}