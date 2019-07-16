const AppClass = require("../index");

let app = new AppClass({
    "examplepow": {
        "extends": "pow",
        "shareStake": 0.3,
        "premine": 6,
        "blocktime": 60,
        "changeBranchDelay": 1,
    },
    "genesis": {
        "id": 'genesis',
        "prev": -1,
        "bits": 1,
        "time": 0,
        "nonce": 0,
    }
});

//event handlers:

app.on("debug", (data) => {
    console.log("[" + new Date().toLocaleTimeString() + "]", "< " + data.level + " >", data.module, data.text);
});


app.on("app.config", (config)=>{
    //trigger before app.start
    console.log("config loaded: ", config)
})

app.on("app.peermanager", ()=>{
    //app.peerManager loaded
})

app.on("app.datamanager", ()=>{
    //app.dataManager loaded
})

app.on("app.selected_consensus", (consensus_name)=>{
    //consensus_name selected
})

app.on("app.consensus.create", (data)=>{
    //data.config config of consensus (with extended fields), data.name - name of consensus, data.field - config field of consensus
})

app.on("app.consensus.init", (data)=>{
    //data.id - hash of top block after init
    //data.height - height of storage
})

app.on("app.data.seek", (dataId)=>{
    //need to search dataId in network (local data dont have this info)
});

//with alias event name: chain.changed 
app.on("app.data.chainchain", (res)=>{
    //console.log("change slice of side chain to main chain, count: " + res.items + 
    //", change from dataId: ", 
    //res.data.getId(), " old height: " + 
    //res.oldheight + ", new height: " + 
    //res.newheight, "now in main: ", res.nowInMain);
});

//added new data to chains
app.on("app.data.new", (data)=>{
    //data.dataId // id of data
    //data.chain (main|side|orphan)
    //data.height (added only if chain = main)
});

app.on("app.data{someDataId}");//emit this event when dataId added in main chain
app.on("app.data.tx{someTxId}");//emit this event when data with txId added in main chain

//emited when remove old data from side/orphan 
app.on("app.data.removeOld", (data)=>{
    //data.chain - side|orphan
    //data.dataId - data id
    //data.delta - seconds timeout of data
})

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