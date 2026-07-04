import Vue from 'vue';

export const dummyComponent = Vue.extend({
  beforeCreate() {
    throw new Error('Do not use the default export but use the factory function instead!');
  },
});