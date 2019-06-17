const AppClass = require("../index");
const { SHA3 } = require('sha3');
let app = new AppClass(require('./fullconfig'));

function hashData(data) {
    const hash = new SHA3(256);
    hash.update(data.id + data.prev + data.bits + data.time + data.nonce);
    return hash.digest('hex');
}

function findHash(data) {
    let a = true;
    let hash;
    data.nonce = 0;

    while (a) {
        let h = hashData(data);
        if (app.consensus.checkHash(h, data.bits)) {
            hash = h;
            break;
        }
        data.nonce++;
    }

    data.id = hash;

    return data;
}


app.on("debug", (data) => {
    console.log("[" + new Date().toLocaleTimeString() + "]", "< " + data.level + " >", data.module, data.text);
});

app.defineDataClass(((app) => {

    class ExampleData extends app.DATA {
        static getPrevIdFieldName() {
            return 'prev';
        }
        isValid() {
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
            super("Example consensus", "pow")
        }
    }

    return ExampleConsensus;
})(app));

app.start('default');//use default app.CONSENSUS (redefined)

let peer1 = new app.PEER({ id: 1 });
app.peerManager.addPeer(peer1);
app.peerManager.addPeer(new app.PEER({ id: 2 }));
app.peerManager.addPeer(new app.PEER({ id: 3 }));

let genesis = app.config.genesis;

let h = 1;
let prev = genesis;
//let _k = [];
for (; ;) {
    let data = {
        id: '',
        prev: prev.id,
        bits: app.consensus.next_network_target(h),
        time: Date.now() / 1000,
        nonce: 0,
        height: h,
    };

    let time = new Date().getTime();
    data = findHash(data);
    console.log('data:', data);
    app.consensus.applyData(peer1, new app.DATA(data));
    prev = data;
    h++;
    console.log(h, data.id, (Date.now() - time) / 1000);

    //_k.push(data);
    // if (h === 6){
    //     console.log(_k);
    //     process.exit(0)
    // }
}
//console.log(app.dataManager.getTopInfo())



