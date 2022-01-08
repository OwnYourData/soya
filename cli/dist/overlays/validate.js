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
exports.SoyaValidate = void 0;
const rdf_validate_shacl_1 = __importDefault(require("rdf-validate-shacl"));
const rdf_1 = require("../utils/rdf");
const logger_1 = require("../services/logger");
const rdf_ext_1 = __importDefault(require("rdf-ext"));
const namedNode = rdf_ext_1.default.namedNode;
class SoyaValidate {
    constructor() {
        this.run = (overlay, data) => __awaiter(this, void 0, void 0, function* () {
            const dataSet = yield (0, rdf_1.parseJsonLd)(data);
            if (dataSet.length === 0)
                throw new Error('Input data is not valid JSON-LD!');
            const layerSet = yield (0, rdf_1.parseJsonLd)(overlay);
            const validator = new rdf_validate_shacl_1.default(layerSet);
            const res = yield validator.validate(dataSet);
            // this are some additional class checks
            // SHACL is not really made to give invalid results if it has an empty set it's applied on
            // therefore we additionally check for the availabiligy of all classes that are defined as SHACL shapes
            const requiredClasses = layerSet.match(undefined, namedNode('http://www.w3.org/ns/shacl#targetClass'), undefined);
            const availableClasses = dataSet.match(undefined, namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), undefined);
            const classChecks = [];
            // check, if all required node shapes are available
            for (const required of requiredClasses) {
                if (availableClasses.match(undefined, namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), required.object).length === 0)
                    classChecks.push({
                        message: 'Missing class',
                        name: required.object.value,
                    });
            }
            logger_1.logger.debug('Data to validate:', dataSet);
            logger_1.logger.debug('SHACL:', layerSet);
            return {
                data: {
                    isValid: res.conforms && classChecks.length === 0,
                    results: res.results.map(x => (Object.assign(Object.assign({ id: x.focusNode, message: x.message }, x.path), { severity: x.severity }))),
                    classChecks,
                }
            };
        });
    }
}
exports.SoyaValidate = SoyaValidate;
//# sourceMappingURL=validate.js.map