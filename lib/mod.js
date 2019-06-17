module.exports = function (app) {

    class Module {

        constructor() {
            this.app = app;
        }
        debug(level, text) {
            let lev = arguments[0];
            let arr = Array.from(arguments).slice(1);
            arr.unshift(this.getModuleName());
            arr.unshift(lev);
            this._debug_.apply(this, arr);
        }
        getModuleName() {
            return this.constructor.name;
        }
        _debug_(level, module_name, text) {

            if (!level)
                level = 'info';

            let arr = [
            ];
            for (let i in arguments) {
                if (i < 2)
                    continue
                arr.push(arguments[i]);
            }

            this.app.emit("debug", {
                level: level,
                module: module_name,
                text: arr,
            });
        }

    }

    return Module;
}
