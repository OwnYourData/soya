import Vue from 'vue';
import VueRouter from 'vue-router';

import { routes } from './routes';
export { RoutePath } from './routes'

Vue.use(VueRouter);

export const router = new VueRouter({
  routes,
  mode: 'hash',
})