"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.packageJson = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("../services/logger");
let json;
try {
    const raw = fs_1.default.readFileSync(path_1.default.join(__dirname, '..', '..', 'package.json'), { encoding: 'utf-8' });
    json = JSON.parse(raw);
}
catch (e) {
    logger_1.logger.error('Can not read package.json', e);
    process.exit(-1);
}
exports.packageJson = json;
//# sourceMappingURL=package.js.map