"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.optionDefaults = exports.parseOptions = exports.spawnSchema = exports.preSpawnSchema = exports.optionsSchema = void 0;
var Joi = _interopRequireWildcard(require("joi"));
var _utils = require("./utils");
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
function createBooleanSchema(name, value) {
    return Joi.string().when("".concat(name), {
        is: Joi["boolean"]().required().valid(true),
        then: Joi.string()["default"](value)
    });
}
var strictBoolean = Joi["boolean"]()["default"](false).strict();
var path = Joi.any().custom(function(value, helpers) {
    try {
        (0, _utils).validateJSONPath(value);
        return value;
    } catch (e) {
        var errorType = e.message.includes(".json") ? "json" : "path";
        return helpers.error("any.invalid", {
            type: errorType
        });
    }
}, "path validation").required().error(function(errors) {
    errors.forEach(function(error) {
        if (error.value === undefined) {
            error.local.type = "path";
        }
    });
    return errors;
});
var optionsSchema = Joi.object({
    color: strictBoolean,
    input: Joi.string()["default"]("file").valid("file", "json", "string"),
    locations: Joi.array().items(Joi.string())["default"]([]),
    output: Joi.string()["default"]("pretty").valid("string", "compact", "pretty", "json"),
    raw: strictBoolean,
    slurp: strictBoolean,
    sort: strictBoolean
});
exports.optionsSchema = optionsSchema;
var preSpawnSchema = Joi.object({
    filter: Joi.string().allow("", null).required(),
    json: Joi.any().alter({
        file: function(schema) {
            return schema.when("/json", {
                is: Joi.array().required(),
                then: Joi.array().items(path),
                otherwise: path
            }).label("path");
        },
        json: function(schema) {
            return Joi.alternatives()["try"](Joi.array(), Joi.object().allow("", null).required().label("json object")).required();
        },
        string: function(schema) {
            return Joi.string().required().label("json string");
        }
    })
});
exports.preSpawnSchema = preSpawnSchema;
var spawnSchema = Joi.object({
    args: Joi.object({
        color: createBooleanSchema("$options.color", "--color-output"),
        input: Joi.any().alter({
            file: function(schema) {
                return schema.when("$json", {
                    is: [
                        Joi.array().items(Joi.string()),
                        Joi.string()
                    ],
                    then: Joi.array()["default"](Joi.ref("$json", {
                        adjust: function(value) {
                            return [].concat(value);
                        }
                    }))
                });
            }
        }),
        locations: Joi.ref("$options.locations"),
        output: Joi.string().when("$options.output", {
            is: Joi.string().required().valid("string", "compact"),
            then: Joi.string()["default"]("--compact-output")
        }),
        raw: createBooleanSchema("$options.raw", "-r"),
        slurp: createBooleanSchema("$options.slurp", "--slurp"),
        sort: createBooleanSchema("$options.sort", "--sort-keys")
    })["default"](),
    stdin: Joi.string()["default"]("").alter({
        json: function(schema) {
            return schema["default"](Joi.ref("$json", {
                adjust: function(value) {
                    return JSON.stringify(value);
                }
            }));
        },
        string: function(schema) {
            return schema["default"](Joi.ref("$json"));
        }
    })
});
exports.spawnSchema = spawnSchema;
var parseOptions = function() {
    var options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, filter = arguments.length > 1 ? arguments[1] : void 0, json = arguments.length > 2 ? arguments[2] : void 0;
    var context = {
        filter: filter,
        json: json,
        options: options
    };
    var validatedSpawn = Joi.attempt({}, spawnSchema.tailor(options.input), {
        context: context
    });
    if (options.input === "file") {
        return Object.keys(validatedSpawn.args).filter(function(key) {
            return key !== "input";
        }).reduce(function(list, key) {
            return list.concat(validatedSpawn.args[key]);
        }, []).concat(filter, json);
    }
    return Object.values(validatedSpawn.args).concat(filter);
};
exports.parseOptions = parseOptions;
var optionDefaults = Joi.attempt({}, optionsSchema);
exports.optionDefaults = optionDefaults;
