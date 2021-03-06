# consensusjs
Consensus module for nodejs. Centralized, PoW, PoS, dPoS, dPoW.

## example 
Look example in folder "example".

## App
This application implements consensus algorithm work. You can reimplement classess, objects, methods for your application.

Have four modules, based on app.MODULE:

- Peer
- Data
- Validator
- PeerManager
- DataManager
- RoundManager
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

### Validator
Define validator node entry

```js
class Validator extends app.MODULE {
    constructor(data);//create new peer
    getId(); //get validator public key
    getVolume(); //must implement validator volume 
    getPriority(); //must implement priority of validator
    updateVolume(volume); //update validator volume 
    updatePriority(priority); //update validator priority 
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

### roundManager
Define Mapper of proof of stake round

```js
class RoundMapper extends app.MODULE {
    getValidatorsList();//sorting active validator list for round
    check(peer, data);//check data for round consensus
    checkBlockTime(peer, data);//check block time for round
    update();//update round info, or start new round
    decrementPriority();//decrement priority for cursor
    incrementPriority();//increment priority for cursor
    getRoundValidators();//get active validators
    addValidator(publickey, priority, volume);//add validators to list
    removeValidator(publickey);//remove validators from list
    validatorCount();//get validator count
    getValidator(key);//get validator instance `app.VALIDATOR`
    getCursorId();//get active cursor for round
    isValidator(key);//check public key for validator
    isActiveValidator(key);//check public key for active validator
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
    static getVersionFieldName()//get version filed name
    getId();//get data id value (hash)
    getVersion();//get version of block
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
    inConsensusVersionRange(data);//check validity of block for version and forks
    getForks();//gets forks config for consensus
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
defineValidatorClass(man);
defineRoundManagerClass(man);
setRoundManager(man);
```

To redefine class you need create you own class and extends one from default modules:

- app.PEER
- app.DATA
- app.VALIDATOR
- app.PEERMANAGER
- app.DATAMANAGER
- app.ROUNDMANAGER
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
            'ignorePrevChilds': true,//ignore childs of prev block when add new block. If this param is false - add new block to side if childs of parent is more then 1
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
            'ignorePrevChilds': true,//ignore childs of prev block when add new block. If this param is false - add new block to side if childs of parent is more then 1
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
        'ddpos': {
            'extends': 'dpos',
            'validatorCount': 60,
            'timeout': 60,//timeout in seconds for sending block for validator. If timedout - decrement priority and set cursor to next
            'staticDelegatesLimit': 5,//enable static delegates from config if connected validator count less then this parameter
            'delegates': [],//if this param is empty - we can make dynamic delegates
            "timeout": 60, //max block time after prev block
            "pause": 20,//min block time after prev block
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
- DynamicDelegateProofOfStakeConsensus

and config sections:
- centralized
- pow
- pos (actually pow+pos)
- dpow
- dpos (actually dpos+pos)
- ddpos

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
        //by default just decrease diff on 10%, nut we can calculate usercoins/allcoins value, and use this param instead shareStake
        return (stake > 0) ? target * (1 - this.getConfig('shareStake', 0.1)) : target;
    }
    ...
}
```

### dpow
Same as pow, but only defined in `config.delegates` publicKeys can send new blocks to network, or messages for `data.isDelegateMessage` method returns `true`.

### dpos
Same pos and dpow implementation.

### ddpos
Essence of this consensus comes down to the Round Robin procedure. The network goes rounds of adding blocks. A general list of validators is set, and at the beginning of each round, a list of active validators for a given round is selected by sorting by the parameters of the total number of coins in delegation and the priority described below. The number of validators active for a round is set by the validatorCount parameter.

At the beginning of the round, a cursor is formed that defines the active validator, which, and only that has the right to generate a block and add it to the network at the moment. After successfully adding a block, the cursor moves to the next validator in the list of active ones until the round ends. After this, the procedure of creating a new round is repeated, by selecting new active validators and moving the cursor to position 0. In the network, you can set a pause for blocks, using the pause parameter (in seconds), at which the block will not be added to the network if the time is between the new and previous block less than that number of seconds.

If the active validator with the cursor does not manage to place the block on the network at the timeout specified by the parameter (in seconds), the cursor moves to the next validator, and it must change the information about the previous validator and add it to the network on its behalf, decreasing the priority parameter by 1.

On the contrary, if the previous validator published the block to the network at the right time and without errors, the next validator should increase the priority parameter by 1 if the parameter is less than zero.

If the total number of validators in the network is less than the staticDelegatesLimit parameter, the network switches to staticDelegates mode, i.e. only validators can publish blocks with public keys described in the delegates array parameter.

## app.Events

List of events: 

* app.config
* app.peermanager
* app.datamanager
* app.roundmanager
* app.selected_consensus
* app.consensus.create
* app.consensus.init
* app.data.seek
* app.data.chainchain
* app.data.new
* app.data{someDataId}
* app.data.tx{someTxId}
* app.data.removeOld
  

 ###  app.config
 Config inited, with 1 parameter - `config`

 ### app.peermanager
 PeerManager loaded

 ### app.datamanager
 DataManager loaded

 ### app.roundmanager
 RoundManager loaded

 ### app.selected_consensus
 Consensus selected (before creation), with 1 parameter `consensus_name`

 ### app.consensus.create
 After creation of consensus, params:
 `data.config` config of consensus (with extended fields)
 `data.name` - name of consensus 
 `data.field` - config field of consensus

 ### app.consensus.init
After initialization of consensus, params:
`data.id` - hash of top block after init
`data.height` - height of storage

### app.data.seek
Try to search data in network, local storages dont have dataId (childs in orphan)
Param: `dataId`

### app.data.chainchain
change slice of side chain to main chain, params: 
`data.items` count of tree items
`data.data` (app.DATA object), change from tree 
`data.oldheight` old height
`data.newheight` new height
`data.nowInMain` now in main (arr with dataId items, replaced to main chain)

### app.data.new
`data.dataId` id of data
`data.chain` (main|side|orphan)
`data.height` added only if chain = main

### app.data{someDataId}
emit this event when dataId added in main chain

### app.data.tx{someTxId}
emit this event when data with txId added in main chain

### app.data.removeOld
emited when remove old data from side/orphan 
`data.chain`  side|orphan
`data.dataId`  data id
`data.delta`  seconds timeout of data