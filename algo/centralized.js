module.exports = function (app) {

    class CentralizedConsensus extends app.CONSENSUS {

        constructor(consensus_name, consensus_config_field) {
            if (!consensus_config_field)
                super('centralized', 'centralized');
            else
                super(consensus_name, consensus_config_field);
            this.debug("debug", "inited");

            if (!this.getConfig('mainNode'))
                throw new Error('Centralized consensus must have mainNode parameter with key of main node.');

        }
        isDataMatch(data, peer) {
            if (this.getConfig('delegateMode')) {//new block can emit more then 1 node:
                return this.getConfig('delegates').indexOf(data.getKey()) >= 0 || data.isDelegateMessage();
            } else
                return data.getKey() == this.getConfig('mainNode');
            return true;
        }

    }

    return CentralizedConsensus;

}