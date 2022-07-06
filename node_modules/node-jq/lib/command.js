"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.commandFactory = exports.INPUT_STRING_ERROR = exports.INPUT_JSON_UNDEFINED_ERROR = exports.FILTER_UNDEFINED_ERROR = void 0;
var Joi = _interopRequireWildcard(require("joi"));
var _path = _interopRequireDefault(require("path"));
var _options = require("./options");
function _defineProperty(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
        return obj;
    } else {
        var newObj = {};
        if (obj != null) {
            for(var key in obj){
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};
                    if (desc.get || desc.set) {
                        Object.defineProperty(newObj, key, desc);
                    } else {
                        newObj[key] = obj[key];
                    }
                }
            }
        }
        newObj.default = obj;
        return newObj;
    }
}
function _objectSpread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _defineProperty(target, key, source[key]);
        });
    }
    return target;
}
var JQ_PATH = process.env.JQ_PATH || _path.default.join(__dirname, "..", "bin", "jq");
var FILTER_UNDEFINED_ERROR = 'node-jq: invalid filter argument supplied: "undefined"';
exports.FILTER_UNDEFINED_ERROR = FILTER_UNDEFINED_ERROR;
var INPUT_JSON_UNDEFINED_ERROR = 'node-jq: invalid json argument supplied: "undefined"';
exports.INPUT_JSON_UNDEFINED_ERROR = INPUT_JSON_UNDEFINED_ERROR;
var INPUT_STRING_ERROR = "node-jq: invalid json string argument supplied";
exports.INPUT_STRING_ERROR = INPUT_STRING_ERROR;
var NODE_JQ_ERROR_TEMPLATE = "node-jq: invalid {#label} " + 'argument supplied{if(#label == "path" && #type == "json", " (not a .json file)", "")}' + '{if(#label == "path" && #type == "path", " (not a valid path)", "")}: ' + '"{if(#value != undefined, #value, "undefined")}"';
var messages = {
    "any.invalid": NODE_JQ_ERROR_TEMPLATE,
    "any.required": NODE_JQ_ERROR_TEMPLATE,
    "string.base": NODE_JQ_ERROR_TEMPLATE,
    "string.empty": NODE_JQ_ERROR_TEMPLATE
};
var validateArguments = function(filter, json, options) {
    var context = {
        filter: filter,
        json: json
    };
    var validatedOptions = Joi.attempt(options, _options.optionsSchema);
    var validatedPreSpawn = Joi.attempt(context, _options.preSpawnSchema.tailor(validatedOptions.input), {
        messages: messages,
        errors: {
            wrap: {
                label: ""
            }
        }
    });
    var validatedArgs = (0, _options).parseOptions(validatedOptions, validatedPreSpawn.filter, validatedPreSpawn.json);
    var validatedSpawn = Joi.attempt({}, _options.spawnSchema.tailor(validatedOptions.input), {
        context: _objectSpread({}, validatedPreSpawn, {
            options: validatedOptions
        })
    });
    if (validatedOptions.input === "file") {
        return {
            args: validatedArgs,
            stdin: validatedSpawn.stdin
        };
    }
    return {
        args: validatedArgs,
        stdin: validatedSpawn.stdin
    };
};
var commandFactory = function(filter, json) {
    var options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}, jqPath = arguments.length > 3 ? arguments[3] : void 0;
    var command = jqPath ? _path.default.join(jqPath, "./jq") : JQ_PATH;
    var result = validateArguments(filter, json, options);
    return {
        command: command,
        args: result.args,
        stdin: result.stdin
    };
};
exports.commandFactory = commandFactory;
