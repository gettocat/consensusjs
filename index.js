const EventEmitter = require('events');

class APP extends EventEmitter {

    constructor(config) {
        super();
        this.MODULE = require("./lib/mod")(this);
        this.config = {};
        this.config = Object.assign(this.config, this.getDefaultConfig(), config);

        if (!this.PEER)
            this.PEER = require("./lib/entries/peer")(this);
        if (!this.DATA)
            this.DATA = require("./lib/entries/data")(this);

        if (!this.PEERMANAGER)
            this.PEERMANAGER = require("./lib/mappers/peer")(this);

        if (!this.DATAMANAGER)
            this.DATAMANAGER = require("./lib/mappers/data")(this);

        if (!this.CONSENSUS)
            this.CONSENSUS = require("./lib/entries/consensus")(this);

        this.CONSENSUS.Centralized = require('./algo/centralized')(this);
        this.CONSENSUS.ProofOfWorkConsensus = require('./algo/pow')(this);
        this.CONSENSUS.ProofOfStakeConsensus = require('./algo/pos')(this);
        this.CONSENSUS.DelegatedProofOfWorkConsensus = require('./algo/static-dpow')(this);
        this.CONSENSUS.DelegatedProofOfStakeConsensus = require('./algo/static-dpos')(this);

    }
    definePeerClass(man) {
        this.PEER = man;
    }
    definePeerManagerClass(man) {
        this.PEERMANAGER = man;
    }
    setPeerManager(man) {
        this.peerManager = man;
    }
    defineDataClass(man) {
        this.DATA = man;
    }
    defineDataManagerClass(man) {
        this.DATAMANAGER = man;
    }
    setDataManager(man) {
        this.dataManager = man;
    }
    defineConsensusClass(man) {
        this.CONSENSUS = man;
    }
    start(consensus) {

        this.emit("app.config", this.config);

        if (!this.peerManager)
            this.peerManager = new this.PEERMANAGER();
        this.emit("app.peermanager");
        if (!this.dataManager)
            this.dataManager = new this.DATAMANAGER();
        this.emit("app.datamanager");

        //if (!this.config.algorithm)
        //    throw new Error('Algorithm of consensus must be defined');

        this.initAlgorithm(this.config.algorithm, consensus);
    }

    initAlgorithm(algorithm_name, algoritm_fnc) {

        if (typeof algoritm_fnc == 'string')
            algorithm_name = algoritm_fnc.toString();

        if (algoritm_fnc instanceof Function) {
            this.consensus = new (algoritm_fnc(this));
        } else {
            let cls = null;
            if (algorithm_name == 'dpow')
                cls = this.CONSENSUS.DelegatedProofOfWorkConsensus;
            if (algorithm_name == 'dpos')
                cls = this.CONSENSUS.DelegatedProofOfStakeConsensus;
            if (algorithm_name == 'pow')
                cls = this.CONSENSUS.ProofOfWorkConsensus;
            if (algorithm_name == 'pos')
                cls = this.CONSENSUS.ProofOfStakeConsensus;
            if (algorithm_name == 'centralized')
                cls = this.CONSENSUS.Centralized;

            if (!cls)
                this.consensus = new this.CONSENSUS();
            else
                this.consensus = new cls();
        }

        this.consensus_name = this.consensus.consensus_config_field;
        this.emit("app.selected_consensus", this.consensus_name);
        this.consensus.init();
    }

    getDefaultConfig() {
        return {
            'centralized': {
                'mainNode': '',//public key, only this node can emit new blocks, if you need make centralized with more then 1 node - use delegateMode
            },
            'pow': {
                "premine": 24,//number of height - when premine will stop
                "blockcount": 12, ///number of blocks in target calculation
                "blocktime": 300, //time of one block in seconds
                "maxtarget": 1, //min difficulty
                "excludeFirst": 1, //dont use this numbers blocks in calculation of new target 
                "diffWindow": 120, //window of data, used for target
                "diffCut": 6,
                "changeBranchDelay": 0,//The number of blocks that we ignore when sidechain length is bigger then main chain,
                "removeOrphanCount": 100,// the number of blocks after which we remove the old blocks from the lost ones
            },
            'pos': {
                'extends': 'pow',//extending config params from pow section
                'shareStake': 0.1,//max share of stake value that we can decrease from target
            },
            'dpos': {
                'extends': 'pos',
                'delegateMode': true,//new block can emit only public keys from this array
                'delegates': []//if this param is empty - we can make dynamic delegates
            },
            'dpow': {
                'extends': 'pow',
                'delegateMode': true,
                'delegates': []//if this param is empty - we can make dynamic delegates
            },
            "genesis": { //need to be rediclared on yours config
                "id": 'genesis',
                "prev": -1,
                "bits": 1,
                "time": 0,
                "nonce": 0,
            }
        };
    }

}

module.exports = APP;