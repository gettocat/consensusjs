const AppClass = require("../index");
const { SHA3 } = require('sha3');


let app = new AppClass({
    "examplepow": {
        "extends": "pow",
        "shareStake": 0.3,
        "premine": 6,
        "blocktime": 60
    },
    "genesis": {
        "id": 'genesis',
        "prev": -1,
        "bits": 1,
        "time": 0,
        "nonce": 0,
    }
});

function rand(min, max) {
    return Math.floor(min + Math.random() * (max + 1 - min));
}

function hashData(data) {
    const hash = new SHA3(256);
    hash.update(data.id + data.prev + data.bits + data.time + data.nonce + data.tx[0].key);
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
    if (data.module == 'DataMapper' && data.text.indexOf("change main chain") == -1)
        return;
    //console.log("[" + new Date().toLocaleTimeString() + "]", "< " + data.level + " >", data.module, data.text);
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
    }

    return PoWConsensus;
})(app));

app.start('default');//use default app.CONSENSUS (redefined)


let peer1 = new app.PEER({ id: 1 });
app.peerManager.addPeer(peer1);
let genesis = app.config.genesis;

let h = 1;
let prev = genesis;
let toggleCount = 0;
let toggle = 0;

let lastTree = [];

for (; ;) {

    if (++toggleCount > 6) {
        toggleCount = 0;
        if (++toggle > 2)
            toggle = 0;
    }

    let key = '0x0';
    if (toggle == 1)
        key = '0x1';
    if (toggle == 2)
        key = '0x2';


    let randParent;
    if (lastTree.length > 2)
        randParent = lastTree[rand(0, 1000) % 3];
    else
        randParent = false;


    if (lastTree.length > 3) {
        lastTree.pop();
    }

    lastTree.unshift(prev.id);


    let data = {
        id: '',
        prev: randParent ? randParent : prev.id,
        bits: app.consensus.next_network_target(h),
        time: Date.now() / 1000,
        nonce: 0,
        height: h,
        tx: [
            { coinbase: 1, key: key }
        ]
    };


    process.stdout.write("\x1b[36m" + h + "\x1b[0m \x1b[33m" + data.prev + "\x1b[0m -> ");

    let time = new Date().getTime();
    data = findHash(data);
    //console.log('data:', data);
    let res = app.consensus.applyData(peer1, new app.DATA(data));
    prev = data;
    h++;

    process.stdout.write(" " + data.id + " | \x1b[33m" + res.chain + "\x1b[0m\n");

    if (h == 30) {
        app.dataManager.printChainMap({ side: true });
        console.log(app.dataManager.chain);
        console.log(app.dataManager.printChainMap({ side: true }))
        process.exit(0)
    }

}