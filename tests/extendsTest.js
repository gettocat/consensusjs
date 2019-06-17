let config = {
    'pow': {
        "premine": 199,//number of height - when premine was stopped
        "blockcount": 12,
        "blocktime": 60,
        "maxtarget": 1,
        "excludeFirst": 1,
        "diffWindow": 120,
        "diffCut": 6
    },
    'extends0':{
        "extends": "pow",
        "premine": 100,
    },
    'extends1': {
        "extends": "pow",
        "premine": 0,//number of height - when premine was stopped
        "blockcount": 12,
        "maxtarget": 1,
        "excludeFirst": 1,
        "diffWindow": 120,
        "diffCut": 6
    },
    "genesis": {
        "id": 'genesis',
        "prev": -1,
        "bits": 1,
        "time": 0,
        "nonce": 0,
    }
}

module.exports = config;