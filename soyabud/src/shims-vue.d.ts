declare module '*.vue' {
  import Vue from 'vue';
  export default Vue;
}

declare module '*.yaml?raw' {
  const content: string;
  export default content;
}

// this package does not ship type declarations
declare module 'vue-bootstrap-typeahead';
