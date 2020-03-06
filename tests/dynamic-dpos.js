const AppClass = require("../index");
const { SHA3 } = require('sha3');
const mtools = require('merkle-tools');

let allcoins = 2000;
let Stakes = {
    '0x01': { volume: 1000, key: '0x01', priority: 0 },
    '0x00': { volume: 100, key: '0x00', priority: 0 },
    '0x02': { volume: 0, key: '0x02', priority: 0 },
}

let timeouts = {
    15: 35000,
    16: 35000,
    17: 35000,
};

let app = new AppClass({
    "exampleddpos": {
        "extends": "ddpos",
        "delegates": ['0x00'],
        "validatorCount": 50,
        "staticDelegatesLimit": 2,
        "timeout": 30, //max block time after prev block
        "pause": 1,//min block time after prev block
    },
    "genesis": {
        "id": 'genesis',
        "prev": -1,
        "bits": 1,
        "time": 0,
        "nonce": 0,
        "tx": [
            { coinbase: 1, key: '0x00', merkle: '00' }
        ]
    }
});

function hashData(data) {
    const hash = new SHA3(256);
    hash.update(data.id + data.prev + data.bits + data.time + data.nonce + data.tx[0].key);
    return hash.digest('hex');
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
            return Stakes[key].volume
        }
        getKey() {
            return this.data.tx[0].key;
        }
        getValidatorsMerkle() {
            return this.data.tx[0].merkle;
        }
        isDelegateMessage() {
            let res = super.isDelegateMessage();
            //in real app: check balance or another info by public key of data, in our example:
            //for ddpos - check if key in validator list, and in top N entries
            if (Object.keys(Stakes).indexOf(this.getKey()) != -1)
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
    class PosConsensus extends app.CONSENSUS.DynamicDelegateProofOfStakeConsensus {
        constructor() {
            super("Example dynamic-dPoS test consensus", "exampleddpos")//must append exampleddpos section in config before start
        }
    }

    return PosConsensus;
})(app));

app.start('default');//use default app.CONSENSUS (redefined)




const merkle = require('merkle-tools')

function reverseBuffer(buff) {
    var out_rev = Buffer.alloc(buff.length), i = 0
    for (; i < buff.length; i++) {
        out_rev[buff.length - 1 - i] = buff[i];
    }

    return out_rev;
}

function makeMerkle(arr) {
    let m = new mtools()
    for (let i in arr) {
        m.addLeaf(reverseBuffer(new Buffer(arr[i].replace('0x', ''), 'hex')).toString('hex'))
    }

    m.makeBTCTree(true);
    return reverseBuffer(new Buffer(m.getMerkleRoot(), 'hex')).toString('hex')
}

//receive message block
//receive cursor message
//if i have started round:

//else:
//wait until next startRound


let genesis = app.config.genesis;
let peers = [];
let prev = genesis;

app.consensus.applyData(peers['0x0'], new app.DATA(genesis));
for (let i in Stakes) {
    peers[i] = new app.PEER({ id: i });
    app.peerManager.addPeer(peers[i]);
    app.consensus.addValidator(Stakes[i].key, Stakes[i].priority, Stakes[i].volume);
}

let promise = Promise.resolve();
let commonHeight = 1; let top = 0;
for (height = 1; height < 100; height++) {
    let k = 0;
    for (let i in Stakes) {

        promise = promise.then(() => {
            return new Promise((resolve, reject) => {

                setTimeout(() => {

                    /*check wrong validator key *\/
                    if (commonHeight == 53)
                        process.exit(0);
                    if (commonHeight == 50 || commonHeight == 51 || commonHeight == 52)
                        i = '0x02';
                    /* */

                    if (k == 0)
                        top++;

                    let data = {
                        id: '',
                        prev: prev.id,
                        bits: top,
                        time: Date.now() / 1000,
                        nonce: k,
                        height: commonHeight,
                        tx: [
                            { coinbase: 1, key: Stakes[i].key, merkle: makeMerkle(Object.keys(Stakes)) }
                        ]
                    };

                    process.stdout.write("\x1b[36m" + (commonHeight) + "\x1b[0m \x1b[33m" + Stakes[i].key + "\x1b[0m \x1b[31m" + parseFloat(data.bits).toFixed(2) + "\x1b[0m \x1b[31m" + parseFloat(data.nonce).toFixed(2) + "\x1b[0m ");

                    commonHeight++;
                    k++;

                    let time = new Date().getTime();
                    let hasErr = false;
                    data.id = hashData(data);

                    try {
                        app.consensus.applyData(peers[i], new app.DATA(data));
                        prev = data;
                        process.stdout.write("\x1b[32m" + parseFloat((Date.now() - time) / 1000).toFixed(2) + "\x1b[0m " + data.id + " (ok) \n");
                        resolve();
                    } catch (e) {
                        process.stdout.write("\x1b[32m 0 \x1b[0m " + data.id + " error: " + e.message + "\n");
                        console.log(e);
                        hasErr = true;
                        resolve();
                        //reject();
                    }



                }, timeouts[commonHeight] ? timeouts[commonHeight] : 1000);

            })
        });

    }

}