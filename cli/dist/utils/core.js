"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeFilename = exports.makeTempDir = exports.exitWithError = void 0;
const logger_1 = require("../services/logger");
const promises_1 = __importDefault(require("fs/promises"));
const find_root_1 = __importDefault(require("find-root"));
const path_1 = __importDefault(require("path"));
const exitWithError = (message) => {
    logger_1.logger.error(message);
    return process.exit(0);
};
exports.exitWithError = exitWithError;
const makeTempDir = () => __awaiter(void 0, void 0, void 0, function* () {
    const tempPath = path_1.default.join((0, find_root_1.default)(__filename), 'temp');
    promises_1.default.mkdir(tempPath, { recursive: true });
    // why do we return an array here?
    // most probably the return value will be consumed with array destructuring, like:
    // [removeDir, path] = await makeTempDir()
    // by returning the method as the first array item we ensure
    // typescript will always complain if the method is not called
    // this way we can "ensure" the temporary directory is always removed after usage
    // let time show us if this was a clever idea :-)
    return [
        () => promises_1.default.rm(tempPath, { recursive: true }),
        tempPath
    ];
});
exports.makeTempDir = makeTempDir;
// escape whitespace in filenames
const escapeFilename = (name) => name.replace(/\s/g, '\\ ');
exports.escapeFilename = escapeFilename;
//# sourceMappingURL=core.js.map