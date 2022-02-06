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
exports.flat2ld = void 0;
const rdf_1 = require("../../utils/rdf");
const rdf_ext_1 = __importDefault(require("rdf-ext"));
const namedNode = rdf_ext_1.default.namedNode;
const iterateItemProps = (dataSet, item, flatJson, base) => {
    for (const prop in flatJson) {
        const val = flatJson[prop];
        if (typeof val === 'object') {
            const refClasses = dataSet.match(namedNode(`${base}${prop}`), namedNode('https://www.w3.org/2000/01/rdf-schema#range'), undefined).toArray();
            if (refClasses[0]) {
                const subItem = {
                    "@type": refClasses[0].object.value.replace(base, ''),
                };
                item[prop] = [subItem];
                iterateItemProps(dataSet, subItem, val, base);
            }
        }
        else
            item[prop] = flatJson[prop];
    }
};
const flat2ld = (flatJson, soyaStructure) => __awaiter(void 0, void 0, void 0, function* () {
    const base = soyaStructure["@context"]["@base"];
    const returnValue = {
        "@context": {
            "@version": 1.1,
            "@vocab": base,
        },
        "@graph": [],
    };
    const dataSet = yield (0, rdf_1.parseJsonLd)(soyaStructure);
    // console.dir(dataSet, { depth: 10 });
    const mainClass = dataSet.match(undefined, namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), namedNode('https://www.w3.org/2002/07/owl#Class')).toArray()[0];
    const item = {
        "@type": mainClass === null || mainClass === void 0 ? void 0 : mainClass.subject.value.replace(returnValue["@context"]["@vocab"], ''),
    };
    returnValue["@graph"].push(item);
    iterateItemProps(dataSet, item, flatJson, base);
    return returnValue;
});
exports.flat2ld = flat2ld;
//# sourceMappingURL=index.js.map