
class DataMapper {

    constructor() {
        this.list = {};
        this.side = {};
        this.orphan = {};
        this.height = {};
        this.chain = [];
        this.top = { height: -1, id: '' };
    }

    getDataList() {
        return this.list;
    }

    seekBlockNetwork(id) {

    }

    tryLongestFrom(data) {
        //we have side block data, 1) check side chain until parent in main (FindParentMain)
        //2) check from data.getId() Child until end
        //3) check orphans, if orphan have parent in side - replace orphan to side
        //3) check height 

        //if height in longchain bigger then mainchain - replace chains.

        let treeParents = this.findParentMain(data.getPrevId());
        let treeChilds = this.findChildSideTree(data.getId(), 0);
        let longestChilds = this.findLongestTree(treeChilds);

        console.log('get childs of hash: ', data.getId())
        //console.log(treeParents, treeChilds);

        let arr = [];

        for (let k in longestChilds) {
            arr.unshift(longestChilds[k]);
        }


        for (let i in treeParents) {
            if (treeParents[i].chain == 'side') {
                arr.unshift(treeParents[i].data);
            }
        }

        if (!arr.length)
            return false;

        let firstSide = this.getSideData(arr[0]);
        let lastMain = this.getData(firstSide.getPrevId());
        let height = this.getDataHeight(lastMain.getId());
        let top = this.getTopInfo();

        if (height + arr.length > top.height) {
            console.log('change main chain');

            let newchain = [];
            for (let i in arr) {
                let data = this.getSideData(arr[i]) || this.getOrphanData(arr[i]);
                if (!data)
                    throw new Error('Can not find data ' + arr[i]);

                newchain.push(data);
            }

            //replace
            for (let i in newchain) {
                this._addDataToBlockChain(newchain[i], true);
            }

        } else
            console.log('stay main chain unchanged');

        //blocks in sidechain and orphan with time bigger than 100 blocks - remove
    }

    findParentMain(previd) {
        let prev = this.getData(previd);
        if (prev)
            return [{ chain: 'main', data: prev.getId() }];

        let tree = [];
        prev = this.getSideData(previd);
        if (prev) {
            tree = this.findParentMain(prev.getPrevId());
            tree.unshift({ chain: 'side', data: prev.getId() });
        }
        return tree;
    }

    findChildSideTree(id) {
        let tree = {};
        let childs = this.getOrphanChilds(id);
        if (childs.length == 0) {
            return [];
        }

        tree[id] = childs;
        for (let i in childs) {
            let d = this.findChildSideTree(childs[i]);
            tree = Object.assign(tree, d);
        }

        return tree;
    }

    findLongestTree(tree) {

        let findPrev = (id) => {
            for (let i in tree) {
                for (let j in tree[i])
                    if (tree[i][j] == id)
                        return i;
            }

            return false;
        }

        let trees = {};
        for (let i in tree) {
            for (let k in tree[i]) {
                let x = tree[i][k];
                let parent = x;
                do {

                    if (!trees[x])
                        trees[x] = [x];

                    parent = findPrev(parent);
                    if (parent)
                        trees[x].push(parent);

                } while (parent);
            }

        }


        let max = -1;
        let maxArr = [];
        for (let i in trees) {
            if (trees[i].length > max) {
                max = trees[i].length;
                maxArr = trees[i];
            }
        }

        return maxArr;
    }

    _addDataToSideChain(data) {
        console.log( data.getId() + ": added to side chain");
        this.side[data.getId()] = data;
        this.tryLongestFrom(data);
    }

    _addDataToOrphan(data) {
        console.log( data.getId() + ": added to orphan chain");
        this.orphan[data.getId()] = data;
        //request prevId from network
        this.seekBlockNetwork(data.getId());
    }

    _addDataToBlockChain(data, forse) {
        let prev = data.getPrevId();
        let isGenesisPrev = prev == this.getGenesis().getId();
        let isGenesis = data.getId() == this.getGenesis().getId();
        let inMainChainPrev = isGenesis ? true : this.getData(prev);
        let inSideChainPrev = isGenesis ? false : this.getSideData(prev);

        if (!forse && !isGenesis) {

            if (!inMainChainPrev && !inSideChainPrev && !isGenesisPrev)
                return this._addDataToOrphan(data);

            if ((this.findChildsMain(prev).length >= 1 || inSideChainPrev) && !isGenesisPrev)
                return this._addDataToSideChain(data);
        }

        let l;

        if (!isGenesis && !isGenesisPrev) {
            let replace_data = false;
            if (isGenesisPrev)
                l = 1;
            else
                l = this.getDataHeight(prev) + 1;

            if (!isNaN(l))
                try {
                    replace_data = this.getDataFromHeight(l);
                    if (replace_data && forse) {
                        //add replace_data to side chain
                        this._addDataToSideChain(replace_data);
                        //add data to main chain
                    }
                } catch (e) { }
        } else
            l = 0;

        this.height[data.getId()] = l;
        this.chain[l] = data.getId();
        if (this.top.height < l) {
            this.top.height = l;
            this.top[Data.getIdFieldName()] = data.getId();
        }
        this.list[data.getId()] = data;
        console.log( data.getId() + ": added to main chain");
    }

    findChildsMain(id) {
        let childs = [];
        for (let k in this.list) {
            if (this.list[k].getPrevId() == id)
                childs.push(k);
        }

        //search in sidechain too?

        return childs;
    }

    getOrphanChilds(id) {
        let childs = [];
        for (let k in this.orphan) {
            if (this.orphan[k].getPrevId() == id)
                childs.push(k);
        }

        return childs;
    }

    addData(data) {
        if (data.isValid()) {
            this._addDataToBlockChain(data);
        } else
            throw new Error('Invalid data');
    }

    getData(id) {
        return this.list[id];
    }

    getSideData(id) {
        return this.side[id];
    }

    getOrphanData(id) {
        return this.orphan[id];
    }

    getDataFromHeight(h) {
        let id = this.chain[h];
        if (id)
            return this.getData(id);

        if (h == 0) {
            let dat = this.getGenesis();
            this._addDataToBlockChain(dat);
            return dat;
        }

        throw new Error('Data is not finded for height: ' + h);

    }

    getDataHeight(dataId) {
        return this.height[dataId];
    }

    getHeight() {
        return this.top.height;
    }

    getDataSlice(to, from) {//top block on top in list[0]
        if (!from)
            from = 0;

        if (to < from)
            throw new Error('You need ask at least 1 data item in slice');

        let start;
        start = this.getDataFromHeight(from);
        let startHeight = -1;

        for (let i in this.chain) {
            if (this.chain[i] == start.getId()) {
                startHeight = i;
                break;
            }
        }

        let dat = [];
        for (let k = startHeight; k <= to; k++) {
            if (this.chain[k])
                dat.unshift(this.getData(this.chain[k]));
        }


        return dat;
    }

    replaceDataById(dataId, newData) {
        let h = this.height[dataId];
        this.height[newData.getId()] = h;
        this.list[newData.getId()] = newData;
        delete this.list[dataId], this.height[dataId];
    }

    replaceData(oldData, newData) {
        this.replaceDataById(oldData.getId(), newData);
    }

    getTopInfo() {
        return this.top;
    }


    getGenesis() {
        return new Data({
            id: 0,
            prevId: -1
        })
    }


}

class Data {

    constructor(data) {
        this.data = data;
    }

    static IsDataMessage(message) {
        if (message[Data.getIdFieldName()]
            && message[Data.getPrevIdFieldName()]
            && message[Data.getTimeFieldName()]
            && message[Data.getBitsFieldName()])
            return true;
        return false;
    }

    static getIdFieldName() {
        return 'id';
    }

    static getPrevIdFieldName() {
        return 'previd';
    }

    static getTimeFieldName() {
        return 'time';
    }

    static getBitsFieldName() {
        return 'bits';
    }

    getId() {
        return this.data[Data.getIdFieldName()];
    }
    getBits() {
        return this.data[Data.getBitsFieldName()];
    }
    getPrevId() {
        return this.data[Data.getPrevIdFieldName()];
    }
    getKey() {
        return this.data.tx[0].key;
    }
    getTime() {
        return this.data[Data.getTimeFieldName()];
    }

    isValid() {

        if (this.getId())
            return true;

        return false;

    }

    /**
     * Check that data is for consensus module
     */
    isImportant() {

        if (this.getId())
            return true;

        return false;

    }

    /**
     * Get stake value of sender this data. 
     * @param {*} height 
     */
    getStakeValue(height) {
        //this method only for proof of stake consensus
        //public key = this.getKey();
        //get from blockchain outs for key 
        return 0;
    }


    /**
     * Check data.getKey() for delegates, if consensus in delegateMode and check dynamic delegates here.
     */
    isDelegateMessage() {
        let delegates = app.config[app.consensus_name].delegates;
        let key = this.getKey();
        if (delegates instanceof Array) {
            if (delegates.indexOf(key) >= 0)
                return true;
            return false;
        }

        return false;
    }

}


let one = new Data({
    id: 1,
    previd: 0,
    time: 0,
    bits: 1
});

let two = new Data({
    id: 2,
    previd: 1,
    time: 0,
    bits: 1
});

let three = new Data({
    id: 3,
    previd: 2,
    time: 0,
    bits: 1
});

let four = new Data({
    id: 4,
    previd: 3,
    time: 0,
    bits: 1
});

let five = new Data({
    id: 5,
    previd: 4,
    time: 0,
    bits: 1
});



let six = new Data({
    id: 6,
    previd: 5,
    time: 0,
    bits: 1
});

let s_six = new Data({
    id: 61,
    previd: 5,
    time: 0,
    bits: 1
});


let seven = new Data({
    id: 7,
    previd: 6,
    time: 0,
    bits: 1
});

let s_seven = new Data({
    id: 71,
    previd: 61,
    time: 0,
    bits: 1
});


let s_8 = new Data({
    id: 81,
    previd: 71,
    time: 0,
    bits: 1
});


let s_9 = new Data({
    id: 91,
    previd: 81,
    time: 0,
    bits: 1
});

let s_101 = new Data({
    id: 101,
    previd: 91,
    time: 0,
    bits: 1
});

let s_102 = new Data({
    id: 102,
    previd: 91,
    time: 0,
    bits: 1
});

let s_111 = new Data({
    id: 111,
    previd: 101,
    time: 0,
    bits: 1
});

let s_121 = new Data({
    id: 121,
    previd: 111,
    time: 0,
    bits: 1
});

let s_122 = new Data({
    id: 122,
    previd: 111,
    time: 0,
    bits: 1
});


let s_123 = new Data({
    id: 123,
    previd: 111,
    time: 0,
    bits: 1
});


let s_132 = new Data({
    id: 132,
    previd: 122,
    time: 0,
    bits: 1
});


let s_133 = new Data({
    id: 133,
    previd: 122,
    time: 0,
    bits: 1
});

let map = new DataMapper();
map.addData(one);
map.addData(two);
map.addData(three);
map.addData(four);
map.addData(five);


//side:
map.addData(six);
map.addData(s_six);


map.addData(seven);
map.addData(s_seven);


//
map.addData(s_9);
map.addData(s_101);
map.addData(s_102);
map.addData(s_111);
map.addData(s_121);
map.addData(s_122);
map.addData(s_123);
map.addData(s_132);
map.addData(s_133);
map.addData(s_8);