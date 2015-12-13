define("box/0.0.1/index", ["dialog/0.0.4/index", "dialog/0.0.2/css/style.css"], function(require, module, exports) {
    var dialog = require("dialog/0.0.4/index");
    var dialogCss = require("dialog/0.0.2/css/style.css");
    console.log("this is loginBox module");
});
define("dialog/0.0.2/css/style.css", [], function(require, module, exports) {
    console.log("this is dialog css module");
});
