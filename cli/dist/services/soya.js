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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoyaService = exports.DEFAULT_SOYA_NAMESPACE = exports.DEFAULT_REPO = void 0;
const main_1 = require("vaultifier/dist/main");
const logger_1 = require("./logger");
// const DEFAULT_REPO = 'http://localhost:8080';
exports.DEFAULT_REPO = 'https://soya.data-container.net';
exports.DEFAULT_SOYA_NAMESPACE = 'https://ns.ownyourdata.eu/ns/soya-context.json';
class SoyaService {
    constructor(repo = exports.DEFAULT_REPO) {
        this.repo = repo;
        // TODO: implement caching
        this.getVaultifier = () => __awaiter(this, void 0, void 0, function* () {
            const v = new main_1.Vaultifier(this.repo);
            yield v.initialize();
            return v;
        });
        this.get = (url, usesAuth) => __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.debug(`GETting ${url}`);
            const { data: res } = yield (yield this.getVaultifier()).get(url, usesAuth);
            return res;
        });
        this.post = (url, usesAuth, data) => __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.debug(`POSTing ${url}`);
            const { data: res } = yield (yield this.getVaultifier()).post(url, usesAuth, data);
            return res;
        });
        this.pull = (path) => __awaiter(this, void 0, void 0, function* () {
            return this.get(`/${path}`, false);
        });
        this.push = (data) => __awaiter(this, void 0, void 0, function* () {
            const v = yield this.getVaultifier();
            const meta = yield v.postValue(data);
            logger_1.logger.debug('Return value of push', meta);
            logger_1.logger.debug(`Fetching item with id ${meta.id}`);
            return v.getItem({
                id: meta.id,
            });
        });
        this.similar = (data) => __awaiter(this, void 0, void 0, function* () {
            return this.post(`/api/soya/similar`, false, data);
        });
        this.info = (path) => __awaiter(this, void 0, void 0, function* () {
            return this.get(`/${path}/info`, false);
        });
    }
}
exports.SoyaService = SoyaService;
SoyaService.INSTANCE = new SoyaService();
SoyaService.getInstance = () => SoyaService.INSTANCE;
SoyaService.initialize = (instance) => SoyaService.INSTANCE = instance;
//# sourceMappingURL=soya.js.map