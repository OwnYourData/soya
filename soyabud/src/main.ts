import './polyfills';

import Vue from 'vue';
import App from './App.vue';
import { router } from './router';
import { getStore } from './store';

import { BootstrapVue, IconsPlugin } from 'bootstrap-vue';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

import VueBootstrapTypeahead from 'vue-bootstrap-typeahead';
import { install as VueMonacoEditorPlugin } from '@guolao/vue-monaco-editor'

import { ConfigService } from './services/config-service';

(async () => {
  await ConfigService.initialize();

  Vue.use(BootstrapVue);
  Vue.use(IconsPlugin);
  Vue.use(VueMonacoEditorPlugin, {
    paths: {
      // You can change the CDN config to load other versions
      vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.51.0/min/vs'
    },
  })

  Vue.component('b-typeahead', VueBootstrapTypeahead);

  new Vue({
    router,
    store: getStore(),
    render: h => h(App)
  }).$mount('#app')
}
)();
