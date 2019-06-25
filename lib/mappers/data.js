module.exports = function (app) {

    class DataMapper extends app.MODULE {

        constructor() {
            super();
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

        getSideList() {
            return this.side;
        }

        getOrphanList() {
            return this.orphan;
        }

        seekBlockNetwork(id) {

        }

        inMainChainData(id) {
            if (this.getData(id) && this.getDataHeight(id) >= 0)
                return true;
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

            let arr = [];
            arr.push(data.getId());

            for (let k in longestChilds) {
                arr.unshift(longestChilds[k]);
            }

            for (let i in treeParents) {
                if (treeParents[i].chain == 'side') {
                    arr.unshift(treeParents[i].data);
                }
            }
            if (arr.length == 1)
                return false;

            this.debug('debug', 'get childs+parents of hash: ', data.getId(), arr.length)

            let lastMain;
            let firstSide = this.getSideData(arr[0]) || false;
            if (!firstSide) {
                lastMain = this.getData(data.getPrevId());
            } else {
                lastMain = this.getData(firstSide.getPrevId());
            }

            let height = this.getDataHeight(lastMain.getId());
            let top = this.getTopInfo();

            let newchain = [], isChangeChain = false;
            if (height + arr.length - app.consensus.config.changeBranchDelay > top.height) {
                isChangeChain = true;

                for (let i in arr) {
                    let d = this.getSideData(arr[i]) || this.getOrphanData(arr[i]) || this.getData(arr[i]);
                    if (!d)
                        throw new Error('Can not find data ' + arr[i]);

                    newchain.push(d);
                }
                this.debug('debug', 'change main chain', arr);

                if (firstSide && lastMain.getId() != data.getPrevId()) {
                    this.sideFromMainFrom(lastMain);
                }

                //replace
                for (let i in newchain) {
                    this._addDataToBlockChain(newchain[i], true);
                    this.removeSideBlock(newchain[i]);
                    this.removeOrphanBlock(newchain[i]);
                }

                app.emit("chain.changed", {
                    data: data,
                    items: height,
                    oldheight: top.height,
                    newheight: height + arr.length,
                    nowInMain: arr,
                });

            } else
                this.debug('debug', 'stay main chain unchanged', height + arr.length - app.consensus.config.changeBranchDelay, "<", top.height);

            //blocks in sidechain and orphan with time bigger than 100 blocks - remove
            this.removeOld();

            return isChangeChain;
        }

        sideFromMainFrom(data) {

            let h = this.getDataHeight(data.getId());
            for (let i = h + 1; ; i++) {
                let id;
                try {
                    id = this.getDataFromHeight(i);
                } catch (e) {
                }

                if (!id)
                    break;

                let d = this.getData(id);
                if (d)
                    this.removeToSide(d, i);
            }

        }

        removeData(data, height) {
            delete this.height[data.getId()];
            delete this.chain[height];
            delete this.list[data.getId()];
        }

        removeToSide(data, height) {
            this._addDataToSideChain(data, true);
            this.removeData(data, height);
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

        _addDataToSideChain(data, forse) {
            this.debug('info', data.getId() + ": added to side chain " + (forse ? "(forse)" : ""));
            this.side[data.getId()] = data;
            let isChangeChain = false;
            if (!forse)
                isChangeChain = this.tryLongestFrom(data);
            return {
                chain: isChangeChain ? 'main' : 'side',
                height: -1,
            }
        }

        _addDataToOrphan(data) {
            this.debug('info', data.getId() + ": added to orphan chain");
            this.orphan[data.getId()] = data;
            //request prevId from network
            this.seekBlockNetwork(data.getId());

            return {
                chain: 'orphan',
                height: -1,
            }
        }

        _addDataToBlockChain(data, forse) {
            let prev = data.getPrevId();
            let isGenesisPrev = prev == this.getGenesis().getId();
            let isGenesis = data.getId() == this.getGenesis().getId();
            let inMainChainPrev = isGenesis ? true : this.getData(prev);
            let inSideChainPrev = isGenesis ? false : this.getSideData(prev);
            let inOrphanChainPrev = isGenesis ? false : this.getOrphanData(prev);

            let haveParentInMain = true;

            if (!this.isDataLinked(data))
                haveParentInMain = false;
            //throw new Error('Invalid data link ' + data.getId());

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
                            if (replace_data.getId() != data.getId())
                                this.removeToSide(replace_data, l);
                            //add data to main chain
                        }
                    } catch (e) { }
            } else
                l = 0;

            this.height[data.getId()] = l;
            this.chain[l] = data.getId();
            if (this.top.height < l) {
                this.top.height = l;
                this.top[app.DATA.getIdFieldName()] = data.getId();
            }
            this.list[data.getId()] = data;
            this.debug('info', data.getId() + ": added to main chain");

            if (!forse && !isGenesis && !isGenesisPrev)
                this.tryLongestFrom(data);

            return {
                chain: 'main',
                height: l,
            }
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
                return this._addDataToBlockChain(data);
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
            let d = this.getData(id);
            if (id && d)
                return d;

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

        /**
        * Check, that data is linked to chain
        * @param {Data} data 
        */
        isDataLinked(data) {
            let prev = data.getPrevId();
            if (this.getData(prev) || this.getGenesis().getId() == prev)
                return true;

            if (this.getSideData(prev) || this.getOrphanData(prev))
                return true;

            return false;
        }

        getGenesis() {
            return new app.DATA(app.config['genesis']);
        }

        removeSideBlock(data) {
            if (data && data instanceof app.DATA && data.getId())
                delete this.side[data.getId()];
        }

        removeOrphanBlock(data) {
            if (data && data instanceof app.DATA && data.getId())
                delete this.orphan[data.getId()];
        }

        removeOld() {
            let sidelist = this.getSideList();
            let orphanlist = this.getOrphanList();

            let blocktime = app.consensus.config.blocktime;
            let removeTime = Date.now() / 1000 - (blocktime * app.consensus.config.removeOrphanCount);
            for (let i in sidelist) {
                let d = sidelist[i];

                if (d.getTime() < removeTime) {
                    this.debug("info", "remove old block from side: ", d.getId(), d.getTime());
                    this.removeSideBlock(d);
                }

            }

            for (let i in orphanlist) {
                let d = orphanlist[i];

                if (d.getTime() < removeTime) {
                    this.debug("info", "remove old block from orphan: ", d.getId());
                    this.removeOrphanBlock(d);
                }
            }
        }

        //for debug
        printChainMap(options) {

            if (!options)
                options = {};

            if (!options.side)
                options.side = false;

            if (!options.orphan)
                options.orphan = false;


            let tree = {};
            for (let id in this.list) {
                if (!tree[this.list[id].getPrevId()])
                    tree[this.list[id].getPrevId()] = [];

                if (tree[this.list[id].getPrevId()].indexOf(id) === -1)
                    tree[this.list[id].getPrevId()].push(id);
            }

            if (options.side) {
                for (let s in this.side) {
                    if (!tree[this.side[s].getPrevId()])
                        tree[this.side[s].getPrevId()] = [];

                    if (tree[this.side[s].getPrevId()].indexOf(s) === -1)
                        tree[this.side[s].getPrevId()].push(s);
                }
            }

            if (options.orphan) {
                for (let o in this.orphan) {
                    if (!tree[this.orphan[o].getPrevId()])
                        tree[this.orphan[o].getPrevId()] = [];
                    if (tree[this.orphan[o].getPrevId()].indexOf(o) === -1)
                        tree[this.orphan[o].getPrevId()].push(o);
                }
            }

            let printNodes = (id, tabcnt) => {

                let str = "";
                let padStart = (wit, cnt) => {
                    let str = "";
                    for (let i = 0; i < cnt; i++) {
                        str += wit;
                    }

                    return str;
                }
                let strstart = padStart("\t", tabcnt);

                str = strstart;
                for (let t in tree[id]) {

                    let hi = "", unhi = " ";
                    if (parseInt(this.height[tree[id][t]]) >= 0 && this.list[tree[id][t]]) {
                        hi = "*";
                        unhi = "";
                    }

                    str += hi + this.getShortDataId(tree[id][t]) + unhi + "" + "\t\t";
                }

                str += "\r\n" + strstart;

                let k = 0;
                for (let t in tree[id]) {
                    str += "|" + ("\t\t\t\t");
                    k++;
                }

                str += "\r\n";

                k = 1
                for (let i in tree[id]) {
                    let s = printNodes(tree[id][i], tabcnt + (k - 1) * 4);
                    str += s;
                    k++;
                }

                return str;
            }

            return printNodes(this.getGenesis().getId(), 1);
        }

        getShortDataId(id) {
            return id.substr(0, 8);
        }

    }

    return DataMapper;

}