const AppClass = require("../index");
const { SHA3 } = require('sha3');

let allcoins = 2000;
let Stakes = {
    '0x0': 100,
    '0x1': 1000,
    '0x2': 0,
}


let app = new AppClass({
    "exampledpos": {
        "extends": "dpos",
        "shareStake": 0.3,
        "premine": 6,
        "blocktime": 60,
        "delegates": ['0x0']//for example we have 1 static delegate in config 0x0, and 1 dynamic 0x2, in data::isDelegateMessage
    },
    "genesis": {
        "id": 'genesis',
        "prev": -1,
        "bits": 1,
        "time": 0,
        "nonce": 0,
    }
});

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
    console.log("[" + new Date().toLocaleTimeString() + "]", "< " + data.level + " >", data.module, data.text);
});

app.defineDataClass(((app) => {

    class PosData extends app.DATA {
        static getPrevIdFieldName() {
            return 'prev';
        }
        getStakeValue(height) {
            let key = this.getKey();
            //get amount of coins on balance of key
            //count of coins without satoshi`s
            return Stakes[key]
        }
        getKey() {
            return this.data.tx[0].key;
        }
        isDelegateMessage() {
            let res = super.isDelegateMessage();
            //in real app: check balance or another info by public key of data, in our example:
            if (this.getKey() == '0x2')
                return true;
            return res;
        }
    }

    return PosData;
})(app));

app.definePeerClass(((app) => {

    class PosPeer extends app.PEER {
        send(peerId, msg) {
            console.log("send from peer", this.getId(), " to peer ", peerId, msg);
        }
    }

    return PosPeer;
})(app));

app.defineConsensusClass(((app) => {
    class PosConsensus extends app.CONSENSUS.ProofOfStakeConsensus {
        constructor() {
            super("Example PoS test consensus", "exampledpos")//must append examplepos section in config before start
        }
        getStakeToTargetTransform(publicKey, stake, target) {

            let share = stake / allcoins;//[0;1]
            let shareAll = 0.3 * share;//max share - 30%
            return target * (1 - shareAll);//min: 0.7 * target, max: 1 * target

        }
        isDataMatch(data, peer) {
            if (this.getConfig('delegateMode')) {
                return this.getConfig('delegates').indexOf(data.getKey()) >= 0 || data.isDelegateMessage();
            }
        }
    }

    return PosConsensus;
})(app));

app.start('default');//use default app.CONSENSUS (redefined)


let peer1 = new app.PEER({ id: 1 });
app.peerManager.addPeer(peer1);
let genesis = app.config.genesis;

let h = 1;
let prev = genesis;
let toggleCount = 0;
let toggle = 0;

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

    let data = {
        id: '',
        prev: prev.id,
        bits: app.consensus.next_network_target(key, Stakes[key], h),
        time: Date.now() / 1000,
        nonce: 0,
        height: h,
        tx: [
            { coinbase: 1, key: key }
        ]
    };

    process.stdout.write("\x1b[36m" + h + "\x1b[0m \x1b[33m" + key + "\x1b[0m \x1b[31m" + parseFloat(data.bits).toFixed(2) + "\x1b[0m ");

    let time = new Date().getTime();
    let hasErr = false;
    data = findHash(data);

    try {
        app.consensus.applyData(peer1, new app.DATA(data));
        prev = data;
        h++;
    } catch (e) {
        process.stdout.write("\x1b[32m 0 \x1b[0m " + data.id + " (invalid sender, not delegate)\n");
        hasErr = true;
    }

    if (!hasErr)
        process.stdout.write("\x1b[32m" + parseFloat((Date.now() - time) / 1000).toFixed(2) + "\x1b[0m " + data.id + " (ok) \n");
}