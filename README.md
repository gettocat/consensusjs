# consensusjs
Consensus module for nodejs. Centralized, PoW, PoS, dPoS, dPoW.

## example 
Look example in folder "example".

## App
This application implements consensus algorithm work. You can reimplement classess, objects, methods for your application.

Have four modules, based on app.MODULE:

- Peer
- Data
- PeerManager
- DataManager
- Consensus

This modules is native and make consensus algorithm. Must be reimplemented, they are *abstract*. 

### Peer
Define connected node entry

```js
class Peer extends app.MODULE {
    constructor(data);//create new peer
    getId(); //get peer id
    send(peerId, msg); //must implement peer sending data algorithm to another peerId
    relay(msg); //sending message to All connected peers
    newMessage(message); //invoke this method when new message recived from peer
    close(code); //invoke this method when peer disconnected or error
    error(code, message); //invoke this method when have some error
}
```

### PeerManager
Define Mapper of Peer entries. Storing, sorting, searching, etc...

```js
class PeerMapper extends app.MODULE {
    getPeersList();//get list of all peers
    addPeer(peer);//add peer to list
    removePeerById(peerId);//remove peer by id
    removePeer(peer);//remove Peer
}
```

### Data
Define blockchain data message (blocks)

```js
class Data extends app.MODULE {
    constructor(data);//create new Data
    static IsDataMessage(message);//check message for data-message fields
    static getIdFieldName();//get field id name from message
    static getPrevIdFieldName();//get field name prev block id from message
    static getTimeFieldName();//get block time field name
    static getBitsFieldName()//get bits filed name
    getId();//get data id value (hash)
    getBits();//get bits value
    getPrevId();//get prevblock hash value
    getKey();//get public key of block (used for pos consensus, need sign coinbase block too)
    getTime();//get timme value
    isValid();//verify block for syntax and value validity
    getStakeValue(height);//used for PoS. Get stake value of block-sender (public key of block)
    isDelegateMessage();//used for delegates. Check block-sender for delegate.
}
```
### DataMapper
Define Mapper of Data entries. Storing, sorting, searching, etc...

```js
class DataMapper extends app.MODULE {

    getDataList();//get all data
    _addDataToBlockChain(data);//add data to list, without verify (init from local version of blockchain)
    addData(data);//add data to list with verify (recive from network)
    getData(id);//get data by id
    getDataFromHeight(h);//get Data by height
    getDataHeight(dataId);//get height by data id
    getHeight();//get blockchain info
    getDataSlice(a, b)//Get slice of data. From a to b, if b is not defined b = 0. b<a. Top block at list[0]
    replaceDataById(dataId, newData);//replace data by hash
    replaceData(oldData, newData);//replace data by obj
    getTopInfo();//get blockchain top info
    isDataLinked(data);//Verify data-linking to chain. Check previd and search it in blockchain
    getGenesis();//get genesis section from config
    getSideList();//get side chain list
    getSideData(id);//get data from sidechain
    getOrphanList();//get orphan chain list
    getOrphanData(id);//get data from orphan chain
    seekBlockNetwork(id);//request block from network (for orphan block parent), MUST be implemented in your code
    inMainChainData(id);//check block for contains in main chain
}
```

### Consensus
Describe consensus algorithm. 

```js
class AbstractConsensus extends app.MODULE {

    constructor(consensus_name, consensus_config_field);//consensus_name - is name for logs,consensus_config_field - config section, with params for this consensus algorithm. See more: config sections 
    getConfig(field, defaultValue);//get config section param (or all if first param is null);
    init()//init consensus
    applyData(peer, data);//add data from peer to consensus
    isPeerCanSendData(peer);//In this method we can check ability of peer to send data in network
    /**
     *Check that data is match to consensus.
        For centralized: match all data, sended from mainNode.
        For delegate proof: match all data, sended from delegate
        For PoW: match data, difficulty > avgDifficultyNetwork
        etc
        * return true if yes, else false.
        */
    isDataMatch(data, peer);
    /**
     * In this mode enabled: only delegate node can send data to network, used for dPos and dPoW consensus.
     */
    isDelegateMode();
    checkHash(hash, target);//Check that hash is valid for this target
}
```

## App.Extending

Any class in application can be redefined before start, for example we have app methods:

```js
definePeerClass(man);
definePeerManagerClass(man);
setPeerManager(man);
defineDataClass(man);
defineDataManagerClass(man);
setDataManager(man);
defineConsensusClass(man);
```

To redefine class you need create you own class and extends one from default modules:

- app.PEER
- app.DATA
- app.PEERMANAGER
- app.DATAMANAGER
- app.CONSENSUS

For example we can create new consensus algorithm with another target-hash verify:

```js
module.exports = function(app) {
    class NewConsensus extends app.CONSENSUS {
        constructor(){
            super('New consensus', 'newconsensus_config_field')
        }
        checkHash(hash, target) {
            return hash * target < 5;
        }   
    }

    return NewConsensus
}
```

Put this code to file newcons.js, and require it:

```js

const newconst = require('newcons.js');
const ConsensusJS = require("consensusjs");
let config = {
    "newconsensus_config_field":{
        "extends":"pow"//read about config extending in config section
    }
    "genesis":{ //required section
        ///...
    }
};
let app = new ConsensusJS(config);
app.defineConsensusClass(newconst(app));
//now you can start app with new consensus
app.start();
```


## Config sections

You can create many config sections:
```js
"section1": {
    "param1": "value1",
    "param2": "value2"
    //etc
}
```

and use it in application: `app.config.section1.param1`
Any consensus have default config section, defined in second param of constructor, for example:
```js
constructor(){
    super('New consensus', 'newconsensus_config_field')
}
```

in this example we must have section `newconsensus_config_field` in config!

### genesis
Genesis section is required for application. Its describe data of default first block in chain.
```js
"genesis": {
    "id": 'genesis hash',
    "prev": -1,
    "bits": 1,
    "time": 0,
    "nonce": 0,
},
```

### extending sections

Config sections can be extending by existing sections:
```js
"section1": {
    "param1":'value1',
    "param2":'value2',
},
"section2":{
    "extends":"section1",
    "param3":"value3"
}
```

In this example section2 have next params: 
```js
"param1":'value1',
"param2":'value2',
"param3":"value3"
```

Extending can be nested:

```js
"section1": {
    "param1":'value1',
    "param2":'value2',
},
"section2":{
    "extends":"section1",
    "param3":"value3"
},
"section3": {
    "extends": "section2",
    "params5": 1,
}
```

it will be: 

```js
"param1":'value1',
"param2":'value2',
"param3":"value3",
"params5": 1,
```

Extending config sections is used for default consensus algorithms, see below.

### default config parameters:

Config default parameters, that can be extend and rewrite defined in `app.getDefaultConfig()`:
```js
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
```

## App default consensus algorithm

ConsensusJs have 5 default consensus algoritm:

- Centralized
- ProofOfWorkConsensus
- ProofOfStakeConsensus
- DelegatedProofOfWorkConsensus
- DelegatedProofOfStakeConsensus

and config sections:
- centralized
- pow
- pow
- dpow
- dpos

You can extend you own consensus algoritm any default algorithm, for example:

```js
class myConsensus extends app.CONSENSUS.ProofOfStakeConsensus {
    constructor () {
        super("My first consensus", "myConsensus");
    }
}
```

and config sections:
```js
"myConsensus":{
    "extends": "pos"
}
```

## Default Consensuses description

### centralized
Only one node, defined in config - can send new blocks to chain. If `config.delegateMode` is enabled, public keys from `config.delegates` can send data too.

### pow 
Block to network can send everyone, who have hashrate and can mine blocks

### pos
Extending pow config and use mining for search new blocks, but if user have stakeValue (bigger percent of coins), he can reduse up to 10% from target and make faster hash searching. Have new method in implementation:

```js
class ProofOfStakeConsensus extends app.CONSENSUS.ProofOfWorkConsensus {
    ...
    getStakeToTargetTransform(publicKey, stake, target) {
        //make some algo, to change target, if stakeValue is not null
        //if user have make coins - target must be lower
        //by default kust decrease diff on 10%, nut we can calculate usercoins/allcoins value, and use this param instead shareStake
        return (stake > 0) ? target * (1 - this.getConfig('shareStake', 0.1)) : target;
    }
    ...
}
```

### dpow
Same as pow, but only defined in `config.delegates` publicKeys can send new blocks to network, or messages for `data.isDelegateMessage` method returns `true`.

### dpos
Same pos and dpow implementation.
