import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import { getAvailableTemplates } from '../system/template';
import { packageJson } from './package';

type cmdInterface = (commandLineArgs.OptionDefinition & commandLineUsage.OptionDefinition);

interface CmdArgs {
  default?: string[],
  repo?: string,
  verbose?: boolean[],
  help?: false,
  executable?: string,
  version: boolean,
}

const globalDefinition: cmdInterface[] = [
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

const commands: string[] = [
  'calculate-dri',
  'validate',
  'transform',
  'template',
  'init',
  'similar',
  'info',
  'push',
];


const getGeneralOptions = (): commandLineUsage.Section => {
  return {
    header: 'General options',
    optionList: globalDefinition.filter(x => !x.defaultOption),
  };
}

const getUsageExamples = (command: string): string[] => {
  return [
    `$ soya ${command} [...options]`,
    `$ cat template.yaml | soya ${command} -vvv`,
    `$ cat document.json | soya ${command} <DRI> --repo https://example.com`,
  ];
}

const printGeneralHelp = () => {
  console.log(commandLineUsage([
    {
      header: `${packageJson.name} (${packageJson.version})`,
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
}

const printSimpleCommandHelp = (command: string) => {
  console.log(commandLineUsage([
    {
      header: 'Usage',
      content: getUsageExamples(command),
    },
    getGeneralOptions(),
  ]));
}

const printTemplateHelp = async () => {
  console.log(commandLineUsage([
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
      content: (await getAvailableTemplates()).map(x => `* ${x}`),
    },
    getGeneralOptions(),
  ]));
}

const printInitHelp = () => {
  console.log(commandLineUsage([
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
}

const printPullHelp = () => {
  console.log(commandLineUsage([
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
}

const printSimilarHelp = () => {
  console.log(commandLineUsage([
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
}

const printInfoHelp = () => {
  console.log(commandLineUsage([
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
}

const printPushHelp = () => {
  console.log(commandLineUsage([
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
}

const transformDefinition: cmdInterface[] = [
  {
    name: 'executable',
    description: 'Defines the executable to use for transformation',
    alias: 'e',
    type: String,
  }
];
const printTransformHelp = () => {
  console.log(commandLineUsage([
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
  ]))
}

export const printCliHelp = async (command?: string): Promise<never> => {
  if (!command)
    printGeneralHelp();
  else {
    switch (command) {
      case 'template':
        await printTemplateHelp();
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
}

export const cmdArgs = commandLineArgs([
  ...globalDefinition,
  ...transformDefinition,
]) as CmdArgs;