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
exports.tryPrintTemplate = exports.getAvailableTemplates = void 0;
const find_root_1 = __importDefault(require("find-root"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../services/logger");
const possibleFileExtensions = [
    'yml',
    'yaml',
];
const TEMPLATES_DIR = path_1.default.join((0, find_root_1.default)(__filename), 'res', 'templates');
const getAvailableTemplates = () => __awaiter(void 0, void 0, void 0, function* () {
    const templates = [];
    for (const file of yield promises_1.default.readdir(path_1.default.join(TEMPLATES_DIR))) {
        templates.push(path_1.default.parse(file).name);
    }
    return templates;
});
exports.getAvailableTemplates = getAvailableTemplates;
const tryPrintTemplate = (name) => __awaiter(void 0, void 0, void 0, function* () {
    for (const fe of possibleFileExtensions) {
        try {
            const file = yield promises_1.default.readFile(path_1.default.join(TEMPLATES_DIR, `${name}.${fe}`), { encoding: 'utf-8' });
            console.log(file);
            return;
        }
        catch (_a) { }
    }
    logger_1.logger.error(`Could not find template with name "${name}"`);
});
exports.tryPrintTemplate = tryPrintTemplate;
//# sourceMappingURL=template.js.map