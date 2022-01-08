"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.SoyaTransform = void 0;
const child_process_1 = __importDefault(require("child_process"));
const promises_1 = __importDefault(require("fs/promises"));
const jq = __importStar(require("node-jq"));
const core_1 = require("../utils/core");
const path_1 = __importDefault(require("path"));
const logger_1 = require("../services/logger");
const cmd_1 = require("../utils/cmd");
class SoyaTransform {
    constructor() {
        this.runJolt = (spec, data) => __awaiter(this, void 0, void 0, function* () {
            const specFile = 'jolt-spec.json';
            const dataFile = 'jolt-data.json';
            logger_1.logger.debug(`Creating temp dir for jolt spec`);
            const [removeTempDir, tempDirPath] = yield (0, core_1.makeTempDir)();
            const specFilePath = path_1.default.join(tempDirPath, specFile);
            logger_1.logger.debug(`Writing jolt spec to ${specFilePath}`);
            yield promises_1.default.writeFile(specFilePath, JSON.stringify(spec));
            const dataFilePath = path_1.default.join(tempDirPath, dataFile);
            logger_1.logger.debug(`Writing jolt data ${dataFilePath}`);
            yield promises_1.default.writeFile(dataFilePath, JSON.stringify(data));
            return new Promise((resolve, reject) => {
                var _a;
                const command = (_a = cmd_1.cmdArgs.executable) !== null && _a !== void 0 ? _a : 'jolt';
                const commandParams = [
                    'transform',
                    (0, core_1.escapeFilename)(specFilePath),
                    (0, core_1.escapeFilename)(dataFilePath),
                ];
                logger_1.logger.debug(`Executing jolt ${command} with ${commandParams.toString()}`);
                child_process_1.default.exec(command + ' ' + commandParams.join(' '), (_, stdout) => {
                    logger_1.logger.debug('Removing temp dir');
                    removeTempDir();
                    let data;
                    try {
                        data = JSON.parse(stdout);
                    }
                    catch (e) {
                        logger_1.logger.error('Could not apply jolt transformation');
                        reject(e);
                    }
                    resolve({
                        data,
                    });
                });
            });
        });
        this.runJq = (filter, data) => __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.debug('Executing jq');
            const jqOut = yield jq.run(filter, data, {
                input: 'json',
            });
            return {
                data: typeof jqOut === 'string' ? JSON.parse(jqOut) : jqOut,
            };
        });
        this.run = (overlay, data) => {
            for (const item of overlay['@graph']) {
                // not a valid transformation overlay
                if (!(item.engine && item.value))
                    continue;
                switch (item.engine) {
                    case 'jolt':
                        if (Array.isArray(item.value)) {
                            return this.runJolt(item.value, data);
                        }
                        else
                            throw new Error('jolt expects an array as input!');
                    case 'jq':
                        if (typeof item.value === 'string') {
                            return this.runJq(item.value, data);
                        }
                        else
                            throw new Error('jq expects a string as input!');
                    default:
                        throw new Error(`Transform engine ${item.engine} not supported!`);
                }
            }
            throw new Error('No transform overlay found!');
        };
    }
}
exports.SoyaTransform = SoyaTransform;
//# sourceMappingURL=transform.js.map