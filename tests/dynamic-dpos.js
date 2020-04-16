const AppClass = require("../index");
const { SHA3 } = require('sha3');
const mtools = require('merkle-tools');

let allcoins = 2000;
let Stakes = {
    '0x01': { volume: 1000, key: '0x01', priority: 0 },
    '0x00': { volume: 100, key: '0x00', priority: 0 },
    '0x02': { volume: 0, key: '0x02', priority: 0 },
}

let Stakes2 = {
    '0x11': { volume: 1000, key: '0x11', priority: 0 },
    '0x12': { volume: 100, key: '0x12', priority: 0 },
    '0x13': { volume: 0, key: '0x13', priority: 0 },
    '0x14': { volume: 0, key: '0x14', priority: 0 },
    '0x15': { volume: 0, key: '0x15', priority: 0 },
    '0x16': { volume: 0, key: '0x16', priority: 0 },
    '0x17': { volume: 0, key: '0x17', priority: 0 },
    '0x18': { volume: 0, key: '0x18', priority: 0 },
    '0x19': { volume: 0, key: '0x19', priority: 0 },
    '0x20': { volume: 0, key: '0x20', priority: 0 },
    '0x21': { volume: 0, key: '0x21', priority: 0 },
    '0x22': { volume: 0, key: '0x22', priority: 0 },
    '0x23': { volume: 0, key: '0x23', priority: 0 },
    '0x24': { volume: 0, key: '0x24', priority: 0 },
}

let timeouts = {
};

let app = new AppClass({
    "exampleddpos": {
        "extends": "ddpos",
        "delegates": ['0x01'],
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
            {
                coinbase: 1, key: '0x01', merkle: '00', out: [
                    { key: '0x01', amount: 0 },
                    { key: '0x00', amount: 0 },
                    { key: '0x02', amount: 0 },
                ]
            },
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

app.consensus.applyData(peers['0x01'], new app.DATA(genesis));
for (let i in Stakes) {
    peers[i] = new app.PEER({ id: i });
    app.peerManager.addPeer(peers[i]);
    app.consensus.addValidator(Stakes[i].key, Stakes[i].priority, Stakes[i].volume);
}

app.roundManager.initCursor();
console.log('next state: ', app.roundManager.getNextState());

let promise = Promise.resolve();
let commonHeight = 1; let top = 0, curr = '0x00', currId = 1;
for (height = 1; height < 100; height++) {
    let k = 0;

    if (height == 18) {//start from 1, 3keys *9 height = 18iterations, then change round.
        promise = promise
            .then(() => {

                for (let i in Stakes) {
                    app.roundManager.removeValidator(i);
                }

                for (let i in Stakes2) {
                    peers[i] = new app.PEER({ id: i });
                    app.peerManager.addPeer(peers[i]);
                    app.roundManager.addValidator(Stakes2[i].key, Stakes2[i].priority, Stakes2[i].volume);
                }

                curr = '0x11';
                currId = 0
                app.roundManager.initCursor();
                return Promise.resolve();
            })
    }

    promise = promise.then(() => {
        return new Promise((resolve, reject) => {

            setTimeout(() => {

                /*check wrong validator key *\/
                if (commonHeight == 53)
                    process.exit(0);
                if (commonHeight == 50 || commonHeight == 51 || commonHeight == 52)
                    i = '0x02';
                /* */

                let datasource = Stakes;
                if (commonHeight > 17) {
                    datasource = Stakes2;
                }

                if (k == 0)
                    top++;

                let data = {
                    id: '',
                    prev: prev.id,
                    bits: top,
                    time: Date.now() / 1000,
                    nonce: Object.keys(datasource).indexOf(curr),
                    height: commonHeight,
                    tx: [
                        { coinbase: 1, key: curr, merkle: makeMerkle(Object.keys(datasource)), out: [] }
                    ]
                };

                for (let i in datasource) {
                    data.tx[0].out.push({ key: datasource[i].key, amount: 0 });
                }

                console.log(curr, Object.keys(datasource).indexOf(curr), 'next state: ', app.roundManager.getNextState());
                process.stdout.write("\x1b[36m" + (commonHeight) + "\x1b[0m \x1b[33m" + curr + "\x1b[0m \x1b[31m" + parseFloat(data.bits).toFixed(2) + "\x1b[0m \x1b[31m" + parseFloat(data.nonce).toFixed(2) + "\x1b[0m ");

                commonHeight++;
                k++;

                let time = new Date().getTime();
                let hasErr = false;
                data.id = hashData(data);

                try {
                    app.consensus.applyData(peers[curr], new app.DATA(data));
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


                console.log('last currId', currId, 'next curr:', curr)
                currId = (currId + 1) % (Object.keys(commonHeight > 17 ? Stakes2 : Stakes).length);
                curr = Object.keys(commonHeight > 17 ? Stakes2 : Stakes)[currId];
                console.log('next currId', currId, 'next curr:', curr)

            }, timeouts[commonHeight] ? timeouts[commonHeight] : 1000);

        })
    });
}