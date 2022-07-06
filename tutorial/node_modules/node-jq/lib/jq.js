"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.run = void 0;
var _exec = _interopRequireDefault(require("./exec"));
var _command = require("./command");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
var run = function(filter, json) {
    var options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}, jqPath = arguments.length > 3 ? arguments[3] : void 0, cwd = arguments.length > 4 ? arguments[4] : void 0;
    return new Promise(function(resolve, reject) {
        var ref = (0, _command).commandFactory(filter, json, options, jqPath), command = ref.command, args = ref.args, stdin = ref.stdin;
        (0, _exec).default(command, args, stdin, cwd).then(function(stdout) {
            if (options.output === "json") {
                var result;
                try {
                    result = JSON.parse(stdout);
                } catch (error) {
                    result = stdout;
                }
                return resolve(result);
            } else {
                return resolve(stdout);
            }
        })["catch"](reject);
    });
};
exports.run = run;
