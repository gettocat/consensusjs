module.exports = function (app) {

    class AlgoMapper extends app.MODULE {

        constructor(data) {
            super();
            this.data = data;
            this.debug("debug", "inited");
        }


    }

    return AlgoMapper;

}