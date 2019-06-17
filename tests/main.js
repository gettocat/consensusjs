const AppClass = require("../index");

let app = new AppClass(require('./fullconfig'));

app.on("debug", (data) => {
    //if (data.module == 'BitcoinProtocol')
    //    return;
    console.log("[" + new Date().toLocaleTimeString() + "]", "< " + data.level + " >", data.module, data.text);
});

app.start();
