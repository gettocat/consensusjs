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
        isValid() {
            if (this.data.id == 3)
                return false;
            return true;
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
    bits: '0x1d00ffff',
    time: Date.now() / 1000
}));
console.log(app.dataManager.getTopInfo())

app.consensus.applyData(peer1, new app.DATA({
    id: 2,
    prev: 1,
    bits: '0x1d00ffff',
    time: Date.now() / 1000
}));
console.log(app.dataManager.getTopInfo())

try {
    app.consensus.applyData(peer1, new app.DATA({
        id: 3,
        prev: 2,
        bits: '0x1d00ffff',
        time: Date.now() / 1000
    }));
    console.log(app.dataManager.getTopInfo())
} catch (e) {
    console.log(e.message, app.dataManager.getTopInfo())
}

app.consensus.applyData(peer1, new app.DATA({
    id: 4,
    prev: 2,
    bits: '0x1d00ffff',
    time: Date.now() / 1000
}));
console.log(app.dataManager.getTopInfo())

