## 0.0.4
### Description
New algorithm dynamic delegate Proof of stake (dPoS)

###  Consensus
`app.CONSENSUS.DynamicDelegateProofOfStakeConsensus` 
Essence of this consensus comes down to the Round Robin procedure. The network goes rounds of adding blocks. A general list of validators is set, and at the beginning of each round, a list of active validators for a given round is selected by sorting by the parameters of the total number of coins in delegation and the priority described below. The number of validators active for a round is set by the validatorCount parameter.

At the beginning of the round, a cursor is formed that defines the active validator, which, and only that has the right to generate a block and add it to the network at the moment. After successfully adding a block, the cursor moves to the next validator in the list of active ones until the round ends. After this, the procedure of creating a new round is repeated, by selecting new active validators and moving the cursor to position 0. In the network, you can set a pause for blocks, using the pause parameter (in seconds), at which the block will not be added to the network if the time is between the new and previous block less than that number of seconds.

If the active validator with the cursor does not manage to place the block on the network at the timeout specified by the parameter (in seconds), the cursor moves to the next validator, and it must change the information about the previous validator and add it to the network on its behalf, decreasing the priority parameter by 1.

On the contrary, if the previous validator published the block to the network at the right time and without errors, the next validator should increase the priority parameter by 1 if the parameter is less than zero.

If the total number of validators in the network is less than the staticDelegatesLimit parameter, the network switches to staticDelegates mode, i.e. only validators can publish blocks with public keys described in the delegates array parameter.

### Config
Added default consensus config ddpos, for extending. 
Added parameters for ddpos:
`section.validatorCount` - count of used validators in round
`section.staticDelegatesLimit` - use static version of dpos if count of validators less than this value (static version use `section.delegates` array of public keys).  
`section.timeout` - if cursor validator (active validator in round) not sent block at `prevblock.time + section.timeout` - change cursor for next validator and send decrementPriority for previous validator.
`section.pause` - minimum pause between blocks.

### Objects
Added new object `app.roundManager` - create and update round of dpos. Managing validators and cursor (roundRobit procedure).
Added new object `app.VALIDATOR` - validator instance

### Methods
`app.defineRoundManagerClass(cls)` - define roundManager Class
`app.setRoundManager(obj)` - set roundManager class
`app.defineValidatorClass(cls)` - define validator Class
`app.setRoundManager(obj)` - set roundManager class
`app.merkle(list)` - create merkle tree (btc style) for list
`consensus.addValidator(publickey, priority, volume)` - add validator to list, this list sorting to active validators for each round.

`validator.getId()`
`validator.getVolume()`
`validator.getPriority()`
`validator.updateVolume(volume)`
`validator.updatePriority(priotiry)`

`roundManager.getRoundValidators()` - get validators for round (sort by volume and priority)
`roundManager.check(peer, data)` - check data for consensus
`roundManager.checkBlockTime(peer, data)` - check time of block for consensus
`roundManager.addValidator(publickey, priority, volume)` - add validator to list
`roundManager.removeValidator(publickey)` - remove validator from list
`roundManager.validatorCount()` - count of validators
`roundManager.getValidator(key)` - validator instance (`app.VALIDATOR`)
`roundManager.getCursorId()` - index of cursor from `0` to `count of active validators`
`roundManager.isValidator(key)` - key is validator
`roundManager.isActiveValidator(key)` - key is active validator

### Events
`app.roundmanager` emit when roundManager inited.

## 0.0.3
### Description
Hard and soft forks implementation. Use version of block to check fork. Can not check orphan and side chains. 

### Config
Added parameter `section.forks`.
```js
"forks": {
    "3": { isHard: true, version: 5 },//this row mean: from height 3 we only accept blocks with version == 5
    "4": { version: 6 }, //this row mean: from height 4 we accept blocks version == 6 too. (check rows before for hard). So: versions from 5 to 6.
    "5": { isHard: true, version: 6 },//same same as for height 3
    "height": {isHard: true/false, version: 'newVersionNumber'}//isHard - can accept versions before this or not.
}
```

Default value for this parameter every time is: 
```js
{
    '0': { isHard: true, version: 1 }
}
```

Default version is `1`.

### Methods
`consensus::inConsensusVersionRange(data)`, `consensus::getForks()` added and `Data::getVersion`. 

### Events
TODO

## 0.0.2
### Description
Side and Orphan chains and merge branches implementation. 

### Config
Added config parameters `section.changeBranchDelay`, `section.removeOrphanCount`. 

### Methods
Added dataMapper methods for side list and orphan list, like `getSideList` and `getSideData(id)` (same same for orphan). Added method `seekBlockNetwork(id)`, for request data in network and method `inMainChainData(id)`.

### Events
New event `chain.changed`, triggered when main chain is changed from side chain (side chain is longer then main). Parameters: 
```js
{
    data: data, //data of block, for what we check branches
    items: height, //count of items in side\orphan blocks for this data (parents + childs)
    oldheight: top.height, //old height of main
    newheight: height + arr.length, //new height of main after change
    nowInMain: arr, //items, added to main (not contain items already from main)
}
```

## 0.0.1
Initial commit, core, pow, pos, delegates, dpow, dpos

## 0.0.14
events
setting ignorePrevChilds - add new blocks and ignore prev childs (if false - add block to side, if prev childs length > 1)