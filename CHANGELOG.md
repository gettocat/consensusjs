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
