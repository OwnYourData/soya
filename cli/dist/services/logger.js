"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = require("winston");
const cmd_1 = require("../utils/cmd");
const getLogLevel = () => {
    var _a;
    switch (((_a = cmd_1.cmdArgs.verbose) !== null && _a !== void 0 ? _a : []).reduce((prev, curr) => curr === true ? prev + 1 : prev, 0)) {
        case 1: return 'warn';
        case 2: return 'info';
        case 3: return 'debug';
        case 4: return 'silly';
        default: return 'error';
    }
};
exports.logger = (0, winston_1.createLogger)({
    level: getLogLevel(),
    format: winston_1.format.json(),
    transports: [
        new winston_1.transports.Console({
            format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.simple())
        })
    ]
});
//# sourceMappingURL=logger.js.map