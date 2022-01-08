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
exports.cmdArgs = exports.printCliHelp = void 0;
const command_line_args_1 = __importDefault(require("command-line-args"));
const command_line_usage_1 = __importDefault(require("command-line-usage"));
const template_1 = require("../system/template");
const package_1 = require("./package");
const globalDefinition = [
    {
        name: 'default',
        defaultOption: true,
        multiple: true,
    },
    {
        name: 'repo',
        description: 'Endpoint where SOyA repository is hosted',
        alias: 'r',
    },
    {
        name: 'verbose',
        description: 'Turns on verbose logging\n-vvvv enables most detailled logs',
        alias: 'v',
        multiple: true,
        type: Boolean,
    },
    {
        name: 'help',
        description: 'Prints general help page and command specific help page',
        alias: 'h',
        type: Boolean,
    },
    {
        name: 'version',
        description: 'Show version number of soya-cli',
        type: Boolean,
        defaultValue: false,
    }
];
const commands = [
    'calculate-dri',
    'validate',
    'transform',
    'template',
    'init',
    'similar',
    'info',
    'push',
];
const getGeneralOptions = () => {
    return {
        header: 'General options',
        optionList: globalDefinition.filter(x => !x.defaultOption),
    };
};
const getUsageExamples = (command) => {
    return [
        `$ soya ${command} [...options]`,
        `$ cat template.yaml | soya ${command} -vvv`,
        `$ cat document.json | soya ${command} <DRI> --repo https://example.com`,
    ];
};
const printGeneralHelp = () => {
    console.log((0, command_line_usage_1.default)([
        {
            header: `${package_1.packageJson.name} (${package_1.packageJson.version})`,
            content: 'The swiss army knife for SOyA 🌱 ({bold S}emantic {bold O}verla{bold y} {bold A}rchitecture)'
        },
        {
            header: 'Usage',
            content: getUsageExamples('<command>')
        },
        {
            header: 'Commands',
            content: commands,
        },
        getGeneralOptions(),
    ]));
};
const printSimpleCommandHelp = (command) => {
    console.log((0, command_line_usage_1.default)([
        {
            header: 'Usage',
            content: getUsageExamples(command),
        },
        getGeneralOptions(),
    ]));
};
const printTemplateHelp = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log((0, command_line_usage_1.default)([
        {
            header: 'Description',
            content: 'Gets you started with SOyA by providing pre-defined YAML templates',
        },
        {
            header: 'Usage',
            content: [
                '$ soya template <template> > my-template.yaml',
            ]
        },
        {
            header: 'Available templates',
            content: (yield (0, template_1.getAvailableTemplates)()).map(x => `* ${x}`),
        },
        getGeneralOptions(),
    ]));
});
const printInitHelp = () => {
    console.log((0, command_line_usage_1.default)([
        {
            header: 'Description',
            content: 'Transforms a SOyA to its respective JSON-LD representation',
        },
        {
            header: 'Usage',
            content: [
                '$ my-doc.yaml | soya init > my-doc.soya.jsonld',
            ]
        },
        getGeneralOptions(),
    ]));
};
const printPullHelp = () => {
    console.log((0, command_line_usage_1.default)([
        {
            header: 'Description',
            content: 'Pulls a schema from a repository',
        },
        {
            header: 'Usage',
            content: [
                '$ soya pull <name | DRI> > document.jsonld',
            ]
        },
        getGeneralOptions(),
    ]));
};
const printSimilarHelp = () => {
    console.log((0, command_line_usage_1.default)([
        {
            header: 'Description',
            content: 'Finds similar data structures within the repository',
        },
        {
            header: 'Usage',
            content: [
                '$ document.jsonld | soya similar',
            ]
        },
        getGeneralOptions(),
    ]));
};
const printInfoHelp = () => {
    console.log((0, command_line_usage_1.default)([
        {
            header: 'Description',
            content: 'Prints information about a SOyA base',
        },
        {
            header: 'Usage',
            content: [
                '$ soya info <name | DRI>',
            ]
        },
        getGeneralOptions(),
    ]));
};
const printPushHelp = () => {
    console.log((0, command_line_usage_1.default)([
        {
            header: 'Description',
            content: 'Pushes a SOyA document to the repository',
        },
        {
            header: 'Usage',
            content: [
                '$ cat document.jsonld | soya push',
            ]
        },
        getGeneralOptions(),
    ]));
};
const transformDefinition = [
    {
        name: 'executable',
        description: 'Defines the executable to use for transformation',
        alias: 'e',
        type: String,
    }
];
const printTransformHelp = () => {
    console.log((0, command_line_usage_1.default)([
        {
            header: 'Description',
            content: 'Uses transformation layers to apply transformations on input data',
        },
        {
            header: 'Usage',
            content: [
                '$ cat input.json | soya transform <name | DRI>',
                '$ cat input.json | soya transform <name | DRI> --executable "java -jar jolt.jar"',
            ]
        },
        {
            header: 'Options',
            optionList: transformDefinition,
        },
        getGeneralOptions(),
    ]));
};
const printCliHelp = (command) => __awaiter(void 0, void 0, void 0, function* () {
    if (!command)
        printGeneralHelp();
    else {
        switch (command) {
            case 'template':
                yield printTemplateHelp();
                break;
            case 'init':
                printInitHelp();
                break;
            case 'pull':
                printPullHelp();
                break;
            case 'similar':
                printSimilarHelp();
                break;
            case 'info':
                printInfoHelp();
                break;
            case 'push':
                printPushHelp();
                break;
            case 'transform':
                printTransformHelp();
                break;
            default:
                if (commands.indexOf(command) !== -1)
                    printSimpleCommandHelp(command);
                else
                    printGeneralHelp();
        }
    }
    process.exit(0);
});
exports.printCliHelp = printCliHelp;
exports.cmdArgs = (0, command_line_args_1.default)([
    ...globalDefinition,
    ...transformDefinition,
]);
//# sourceMappingURL=cmd.js.map