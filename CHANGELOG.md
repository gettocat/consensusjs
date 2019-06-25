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
