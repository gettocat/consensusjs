const AppClass = require("../index");

let app = new AppClass(require('./fullconfig'));

app.on("debug", (data) => {
    console.log("[" + new Date().toLocaleTimeString() + "]", "< " + data.level + " >", data.module, data.text);
});

app.defineDataClass(((app) => {

    class ExampleData extends app.DATA {
        static getPrevIdFieldName() {
            return 'prev';
        }
        getStakeValue(height) {
            let key = this.getKey();
            //get amount of coins on balance of key
            //count of coins without satoshi`s
            return 100// / app.consensus.getConfig('satoshi');
        }
        getKey() {
            return this.data.tx[0].key;
        }
    }

    return ExampleData;
})(app));

app.definePeerClass(((app) => {

    class ExamplePeer extends app.PEER {
        send(peerId, msg) {
            console.log("send from peer", this.getId(), " to peer ", peerId, msg);
        }
    }

    return ExamplePeer;
})(app));

app.defineConsensusClass(((app) => {
    class ExampleConsensus extends app.CONSENSUS.ProofOfStakeConsensus {
        constructor() {
            super("Example consensus", "example")//must append example section in config before start
        }
    }

    return ExampleConsensus;
})(app));

app.start('default');//use default app.CONSENSUS (redefined)


let peer1 = new app.PEER({ id: 1 });
app.peerManager.addPeer(peer1);
app.peerManager.addPeer(new app.PEER({ id: 2 }));
app.peerManager.addPeer(new app.PEER({ id: 3 }));

app.consensus.applyData(peer1, new app.DATA({
    id: 1,
    prev: 0,
    bits: 0x1d63ff9c,
    time: Date.now() / 1000,
    tx: [
        { coinbase: 1, key: '0x0' }
    ]
}));
console.log(app.dataManager.getTopInfo())

app.consensus.applyData(peer1, new app.DATA({
    id: 2,
    prev: 1,
    bits: 0x1d63ff9c,
    time: Date.now() / 1000,
    tx: [
        { coinbase: 1, key: '0x0' }
    ]
}));
console.log(app.dataManager.getTopInfo())

app.consensus.applyData(peer1, new app.DATA({
    id: 3,
    prev: 2,
    bits: 0x1d63ff9c,
    time: Date.now() / 1000,
    tx: [
        { coinbase: 1, key: '0x0' }
    ]
}));
console.log(app.dataManager.getTopInfo())

app.consensus.applyData(peer1, new app.DATA({
    id: 4,
    prev: 2,
    bits: '0x1d00ffff',
    time: Date.now() / 1000,
    tx: [
        { coinbase: 1, key: '0x0' }
    ]
}));
console.log(app.dataManager.getTopInfo())

