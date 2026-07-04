<template>
  <div class="jumbotron">
    <h1 class="display-5">SOyA Login</h1>

    <b-form @submit="submitForm">
      <b-form-group label="App Key:">
        <b-form-input
          required
          name="username"
          v-model="appKey"
        ></b-form-input>
      </b-form-group>
      <b-form-group label="App Secret:">
        <b-form-input
          required
          name="password"
          type="password"
          v-model="appSecret"
        ></b-form-input>
      </b-form-group>
      <b-form-group
        label="Scope:"
        v-if="scopeOptions"
      >
        <b-form-select
          required
          :options="scopeOptions"
          v-model="scope"
        ></b-form-select>
      </b-form-group>

      <b-button
        type="submit"
        variant="primary"
      >Login</b-button>
    </b-form>

    <div class="mt-3">
      <b-button
        :key="idp.authority"
        v-for="idp of identityProviders"
        variant="outline-dark"
        @click="() => $emit('useIdentityProvider', idp)"
      >
        <img
          class="button-icon"
          v-if="idp.imageUrl"
          :src="idp.imageUrl"
        />
        {{getIdentityProviderTitle(idp)}}
      </b-button>
    </div>
  </div>
</template>

<style scoped>
.button-icon {
  max-height: 1.5em;
  max-width: 1.5em;
}
</style>

<script lang="ts">
import Vue, { PropType } from 'vue';
import { OAuthIdentityProvider, OAuthSupport } from 'semcon-js';
import { getTranslation } from '../utils';

export interface Data {
  appKey: string,
  appSecret: string,
  scope?: string,
}

export default Vue.extend({
  props: {
    scopes: Array as PropType<string[] | undefined>,
    identityProviders: Array as PropType<(OAuthSupport | OAuthIdentityProvider)[] | undefined>,
  },
  data: (): Data => ({
    appKey: '',
    appSecret: '',
    scope: undefined,
  }),
  created() {
    if (this.scopes && this.scopes.length > 0)
      this.scope = this.scopes[0];
  },
  methods: {
    submitForm(event: Event) {
      event.preventDefault();

      this.$emit('login', {
        appKey: this.appKey,
        appSecret: this.appSecret,
        scope: this.scope,
      } as Data);
    },
    getIdentityProviderTitle(identityProvider: OAuthIdentityProvider) {
      // 'OAuth' is the default string for OYD-internal authorization code
      return getTranslation(identityProvider.title ?? 'OAuth');
    }
  },
  computed: {
    scopeOptions() {
      return this.scopes?.map((x) => ({
        text: x,
        value: x,
      }));
    }
  }
})
</script>