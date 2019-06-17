const AppClass = require("../index");

let app = new AppClass({
    "section1": {
        //have inapp default values: centralized, pow, pos, dpow, dpos, details below.
        "extends": "dpow",//can extend section, for example we can create section2 and extends section1 params.
    },
    "section2": {//extending can be nested
        "extends": "section1"
    },
    "genesis": {//requied!, defile first, genesis block here.
        "id": 'genesis',
        "prev": -1,
        "bits": 1,
        "time": 0,
        "nonce": 0,
    },
    //below we create sections for each consensus algorithm and show required params for each:
    "centralized": {
        //public key of centralized node, only for centralized consensus.
        "mainNode": "0x0"
    },
    "pow": {
        "premine": 24,//how much blocks we need skip, before recalc target start works
        "blockcount": 12, ///number of blocks in target calculation
        "blocktime": 300, //time of one block in seconds
        "maxtarget": 1, //min difficulty value, we search hash value (uint128) smaller than: hash*target < 2^250
        "excludeFirst": 1, //dont use this numbers blocks in calculation of new target 
        "diffWindow": 120, //window of data, used for target
        "diffCut": 6
    },
    'pos': {
        'extends': 'pow',//extending config params from pow section
        //this value is used only for pos/dpos consensus algo, defile how much percent we can decrease in target for stake value, for example: newtarget = (1-shareStake)*target
        'shareStake': 0.1,//max share of stake value that we can decrease from target
    },
    'dpow': {
        'extends': 'pow',
        'delegateMode': true,//new block can emit only public keys from this array or from method data::isDelegateMessage
        //used only for dpow,dpos. We can write static delegates who can send new blocks (check public key of coinbase tx of block, yes, coinbase tx must be signed like another)
        "delegates": ['0x0']//for example we have 1 static delegate in config 0x0, and 1 dynamic 0x2, in data::isDelegateMessage
    },
    'dpos': {
        'extends': 'pos',
        'delegateMode': true,
        'delegates': []
    },
});

app.on("debug", (data) => {//debug event
    console.log("[" + new Date().toLocaleTimeString() + "]", "< " + data.level + " >", data.module, data.text);
});

//here you can redefine data class
app.defineDataClass(((app) => {

    class PosData extends app.DATA {//must extends from app.DATA class, and redefine it here
        //for each fields [id, public key of sender (for pos/dpos), previd (prev block id), bits, time, ]
        //for each method we can redefine get{Field}FieldName
        static getPrevIdFieldName() {
            return 'prev';
        }
        //redefine check for valididy of block
        isValid() {
            return super.isValid();
        }
        //stake value for pos\dpos for public key
        getStakeValue(height) {
            let key = this.getKey();
            //get amount of coins on balance of key
            return Stakes[key]
        }
        //get public key from block (sign coinbase)
        getKey() {
            return this.data.tx[0].key;
        }
        //check that message is from delegate. By public key
        isDelegateMessage() {
            let res = super.isDelegateMessage();
            //in real app: check balance or another info by public key of data, in our example:
            if (this.getKey() == '0x2')
                return true;
            return res;
        }

        //allMethods:
        //static IsDataMessage(message) - is message data, check
        //static getIdFieldName() - name of "id" field
        //static getPrevIdFieldName() - "prevId" name field
        //static getTimeFieldName() - name of field "time"
        //static getBitsFieldName() - "bits" name field
        //getId() - get id value
        //getPrevId() //get prevId value
        //getBits() - get bits value
        //getKey() - get public key of block (used for POS consensus only - need sign coinbase block)
        //getTime() - get time valye
        //isValid() check that data is valid, must be reimplemented
        //getStakeValue(height) - get stake value for this.getKey(), used only for POS consensys
        //isDelegateMessage() - check data for delegate owner, used only in delegateMode 
    }

    return PosData;
})(app));

//redefine Peer class
app.definePeerClass(((app) => {

    class PosPeer extends app.PEER {
        send(peerId, msg) {
            console.log("send from peer", this.getId(), " to peer ", peerId, msg);
        }
        //methods:
        //getId - id of peer
        //relay(msg) - send for all connected nodes
        //newMessage - recive message method, invoke when new message recived
        //close - close implementation, invoke on error,close
        //error - invoke on error

    }

    return PosPeer;
})(app));

app.defineConsensusClass(((app) => {
    //default consensuses:
    //app.CONSENSUS.Centralized
    //app.CONSENSUS.ProofOfWorkConsensus
    //app.CONSENSUS.ProofOfStakeConsensus
    //app.CONSENSUS.DelegatedProofOfWorkConsensus
    //app.CONSENSUS.DelegatedProofOfStakeConsensus
    class PosConsensus extends app.CONSENSUS.ProofOfStakeConsensus {
        constructor() {
            //first param - name of your consensus algorithm, second param - section on config, used for this consensus
            super("Example PoS test consensus", "exampledpos")//must append examplepos section in config before start
        }

        //all methods (must be implemented for your consensus):
        //applyData(peer, data) - add Data to blockchain
        //isPeerCanSendData(peer) - check: can peer send data
        //isDataMatch(data, peer) - check: can add this data to consensus
        //isDelegateMode() - true if we have delegatePoS/delegatePoW consensus
        //checkHash(hash, target) - check hash for this target
        //getStakeToTargetTransform(publicKey, stake, target) - transform stakeValue of publicKey for target (used for decrease target for investors in POS)

        getStakeToTargetTransform(publicKey, stake, target) {

            let share = stake / allcoins;//[0;1]
            let shareAll = 0.3 * share;//max share - 30%
            return target * (1 - shareAll);//min: 0.7 * target, max: 1 * target

        }
        isDataMatch(data, peer) {
            if (this.getConfig('delegateMode')) {
                return this.getConfig('delegates').indexOf(data.getKey()) >= 0 || data.isDelegateMessage();
            }
        }
    }

    return PosConsensus;
})(app));

//application have mappers, for peer and data, it must be redefined too:

app.definePeerManagerClass(((app) => {

    class PeerManager2 extends app.PEERMANAGER {
        //methods:
        //getPeersList() - get all connected peer list
        //addPeer(peer) - add new peer to list
        //removePeerById(peerId) - remove  peer by id
        //removePeer(peer) remove peer
    }

    return PeerManager2;
})(app));

app.defineDataManagerClass(((app) => {

    class DataManager2 extends app.DATAMANAGER {
        constructor() {
            //methods:
            //getDataList() - get all blocks
            //_addDataToBlockChain(data) - add Data to blockchain without any checking (startup init from db)
            //addData(data) - add to blockchain with checks for data-valid (from network)
            //getData(id) - get data by id
            //getDataFromHeight(h) - get data from height
            //getDataHeight(dataId) - return height by id
            //getHeight() - get blockchain height
            //getDataSlice(a, b) - get slice of blockchain from a to b, if b is not exist - b = 0, top block on top in list[0] 
            //replaceDataById(dataId, newData) - replace blocks with id with newData
            //replaceData(oldData, newData) - replace oldBlock to newBlock
            //getTopInfo() - get top block hash and height
            //isDataLinked(data) - check data for linking to blockchain (data.previd exist or genesis)
            //getGenesis() - return genesis section from config
        }


    }

    return DataManager2;
})(app));

//start application
app.start('default');//use default app.CONSENSUS (redefined)