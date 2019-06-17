module.exports = function (app) {

    class DataMapper extends app.MODULE {

        constructor() {
            super();
            this.list = {};
            this.height = {};
            this.chain = [];
            this.top = { height: -1, id: '' };
            this.debug("debug", "inited");
        }

        getDataList() {
            return this.list;
        }

        _addDataToBlockChain(data) {
            let l = Object.keys(this.list).length;
            this.height[data.getId()] = l;
            this.chain[l] = data.getId();
            this.top.height = l;
            this.top[app.DATA.getIdFieldName()] = data.getId();
            this.list[data.getId()] = data;
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

        /**
         * Check, that data is linked to chain
         * @param {Data} data 
         */
        isDataLinked(data) {
            let prev = data.getPrevId();
            if (this.getData(prev) || this.getGenesis().getId() == prev)
                return true;

            return false;
        }

        getGenesis() {
            return new app.DATA(app.config['genesis']);
        }


    }

    return DataMapper;

}