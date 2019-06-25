const AppClass = require("../index");

let app = new AppClass({
    "examplepow": {
        "extends": "pow",
        "shareStake": 0.3,
        "premine": 6,
        "blocktime": 60,
        "changeBranchDelay": 1,
        "forks": {
            "3": { isHard: true, version: 5 },
            "4": { version: 6 },
            "5": { isHard: true, version: 6 },
        }
    },
    "genesis": {
        "id": 'genesis',
        "prev": -1,
        "bits": 1,
        "time": 0,
        "nonce": 0,
    }
});

app.on("debug", (data) => {
    //if (data.module == 'DataMapper' && data.text.indexOf("change main chain") == -1)
    //    return;
    console.log("[" + new Date().toLocaleTimeString() + "]", "< " + data.level + " >", data.module, data.text);
});

app.defineDataClass(((app) => {

    class PosData extends app.DATA {
        static getPrevIdFieldName() {
            return 'prev';
        }
    }

    return PosData;
})(app));

app.defineConsensusClass(((app) => {
    class PoWConsensus extends app.CONSENSUS.ProofOfWorkConsensus {
        constructor() {
            super("Example PoW orphan-side-chains test consensus", "examplepow")
        }
        isDataMatch() {
            return true;
        }
    }

    return PoWConsensus;
})(app));

app.start('default');//use default app.CONSENSUS (redefined)

let peer1 = new app.PEER({ id: 1 });
app.peerManager.addPeer(peer1);


app.consensus.applyData(peer1, new app.DATA({
    id: 'genesis',
    prev: -1,
    time: Date.now() / 1000,
    bits: 1
}));


app.consensus.applyData(peer1, new app.DATA({
    id: 1,
    prev: 'genesis',
    time: Date.now() / 1000,
    bits: 1
}));


app.consensus.applyData(peer1, new app.DATA({
    id: 2,
    prev: 1,
    time: Date.now() / 1000,
    bits: 1
}));

app.consensus.applyData(peer1, new app.DATA({
    id: 3,
    prev: 2,
    time: Date.now() / 1000,
    bits: 1
}));

app.consensus.applyData(peer1, new app.DATA({
    id: 4,
    prev: 3,
    time: Date.now() / 1000,
    bits: 1
}));

app.consensus.applyData(peer1, new app.DATA({
    id: 5,
    prev: 4,
    time: Date.now() / 1000,
    bits: 1
}));


app.consensus.applyData(peer1, new app.DATA({
    version: 6,
    id: 6,
    prev: 5,
    time: Date.now() / 1000,
    bits: 1
}));



app.consensus.applyData(peer1, new app.DATA({
    version: 5,
    id: 7,
    prev: 6,
    time: Date.now() / 1000,
    bits: 1
}));