const AppClass = require("../index");

let app = new AppClass(require('./extendsTest.js'));

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
    class ExampleConsensus extends app.CONSENSUS.ProofOfWorkConsensus {
        constructor() {
            super("Extends test consensus", "extends1")//must append extends1 section in config before start
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
    id: '023a0b867615858474b8c24d210b962b48fbd422ef150858fa340a3308ba4556',
    prev: 'genesis',
    bits: 1,
    nonce: 1,
    time: 1560616708.227,
    height: 1,
    tx: [
        { coinbase: 1, key: '0x0' }
    ]
}));
console.log(app.dataManager.getTopInfo())

app.consensus.applyData(peer1, new app.DATA({
    id: '03da821e3f46a9949428637a941222770a1998a9a6cf9067fda1426273422dc1',
    prev: '023a0b867615858474b8c24d210b962b48fbd422ef150858fa340a3308ba4556',
    bits: 1,
    nonce: 287,
    time: 1560616708.239,
    height: 1,
    tx: [
        { coinbase: 1, key: '0x0' }
    ]
}));
console.log(app.dataManager.getTopInfo())

app.consensus.applyData(peer1, new app.DATA({
    id: '00f629dbba061358718e9b36eff94c23195c39a75f038acf3cd5209fb596862c',
    prev: '03da821e3f46a9949428637a941222770a1998a9a6cf9067fda1426273422dc1',
    bits: 1,
    nonce: 115,
    time: 1560616708.289,
    tx: [
        { coinbase: 1, key: '0x0' }
    ]
}));
console.log(app.dataManager.getTopInfo())

app.consensus.applyData(peer1, new app.DATA({
    id: '006d305899448e54ae898473c79cbf55d0e82e329b3f4c103c14eff41a28e854',
    prev: '00f629dbba061358718e9b36eff94c23195c39a75f038acf3cd5209fb596862c',
    bits: 1,
    nonce: 73,
    time: 1560616708.298,
    tx: [
        { coinbase: 1, key: '0x0' }
    ]
}));
console.log(app.dataManager.getTopInfo())
console.log(app.consensus.getConfig()); 

