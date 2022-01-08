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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Std = void 0;
class Std {
}
exports.Std = Std;
_a = Std;
Std.in = () => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise(function (resolve, reject) {
        const stdin = process.stdin;
        let data = '';
        stdin.setEncoding('utf8');
        stdin.on('data', function (chunk) {
            data += chunk;
        });
        stdin.on('end', function () {
            resolve(data);
        });
        stdin.on('error', reject);
    });
});
//# sourceMappingURL=std.js.map