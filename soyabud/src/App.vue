<template>
  <div>
    <b-container :fluid="isUiFluid">
      <nav-bar
        :title="title"
        :description="description"
        :url="semconUrl"
        :hasLogout="hasLogout"
        :additionalActions="additionalNavBarActions"
        @logout="logOut"
        @login="showLoginForm"
      >
      </nav-bar>
    </b-container>
    <b-container v-if="isInitializing">
      <div class="jumbotron">
        <span class="lead">
          {{title}} <span class="text-muted">is loading <spinner></spinner></span>
        </span>
      </div>
    </b-container>
    <b-container v-else-if="hasMessage">
      <div class="jumbotron">
        <h1 class="display-5">Buddy Message</h1>
        <p class="lead">{{message}}</p>
      </div>
    </b-container>
    <b-container v-else-if="isLoginFormShowed">
      <login
        :scopes="semconSupport.scopes"
        :identityProviders="identityProviders"
        @login="logIn"
        @useIdentityProvider="tryInitializeSemcon"
      ></login>
    </b-container>
    <router-view v-else></router-view>
  </div>
</template>

<style scoped>
.lead {
  white-space: pre-wrap;
}
</style>

<script lang="ts">
import Vue from "vue";
import { setInstance as setSemcon, initialize as initializeSoya } from './services';
import Spinner from './components/Spinner.vue'
import NavBar from './components/NavBar.vue'
import Login, { Data as LoginData } from './components/Login.vue'
import { Semcon, SemconSupport, SemconInfo, SemconWeb, OAuthIdentityProvider, OAuthSupport, OAuthExternalProvider } from 'semcon-js';
import { RoutePath } from './router';
import { RouteParams } from "./router/routes";
import { IStore } from "./store";
import { ConfigService } from "./services/config-service";
import { RepoService, Soya } from "soya-js";
import { Action, ActionMethod } from "./utils/actions";

const isLoginData = (data: any): data is LoginData => {
  const d = data as LoginData;
  return d.appKey !== undefined && d.appSecret !== undefined;
}

interface IData {
  isInitializing: boolean,
  isLoggedIn: boolean,
  message?: string,
  semconSupport?: SemconSupport,
  semconInfo?: SemconInfo,
  semconUrl?: string,
}

export default Vue.extend({
  components: {
    Spinner,
    Login,
    NavBar,
  },
  created() {
    this.initialize();
  },
  data: (): IData => ({
    isInitializing: true,
    isLoggedIn: false,
    message: undefined,
    semconSupport: undefined,
    semconInfo: undefined,
    semconUrl: undefined,
  }),
  methods: {
    async initialize() {
      this.tryInitializeSemcon();

      const { searchParams } = new URL(window.location.href);

      const schema = searchParams.get(RouteParams.SCHEMA_DRI);
      if (schema && this.$router.currentRoute.path !== RoutePath.SCHEMA_VIEW)
        this.$router.push(RoutePath.SCHEMA_VIEW);

      const itemId = searchParams.get(RouteParams.ITEM_ID);
      if (itemId && this.$router.currentRoute.path !== RoutePath.ITEM_VIEW)
        this.$router.push(RoutePath.ITEM_VIEW);
    },
    async tryInitializeSemcon(credentials?: OAuthIdentityProvider | OAuthExternalProvider | LoginData) {
      this.isInitializing = true;

      let semcon: Semcon | undefined = undefined;

      const vw = await SemconWeb.create({
        baseUrl: ConfigService.get('endpoint', 'url'),
        clientId: ConfigService.get('endpoint', 'clientId'),
      });

      if (vw.semcon)
        this.semconUrl = vw.semcon.urls.baseUrl;

      try {
        if (credentials) {
          if (vw.semcon && isLoginData(credentials)) {
            vw.semcon.setCredentials(credentials);
            await vw.semcon.initialize();
          }
          else if ((credentials as OAuthExternalProvider).link) {
            window.location.href = (credentials as OAuthExternalProvider).link;
            return;
          }
          else {
            await vw.initialize({
              oAuthType: credentials as OAuthIdentityProvider,
            });
          }
        }
        else
          await vw.initialize();
      } catch (e) {
        console.error(e);
      }

      if (vw.semcon) {
        semcon = vw.semcon;
        setSemcon(semcon);
      }

      if (!semcon) {
        this.message = `Sorry. I was not able to create a semcon instance.
Try looking into the browser console to gain more insights on the problem.`;
        this.isInitializing = false;
        return;
      }

      initializeSoya(new Soya({
        service: RepoService.fromSemcon(semcon, 'optional')
      }));

      try {
        this.semconSupport = await semcon.getSemconSupport();

        if (await semcon.isAuthenticated()) {
          this.isLoggedIn = true;
        }
        else {
          try {
            await semcon.initialize();
            this.isLoggedIn = await semcon.isAuthenticated();
          } catch {
            // ignore: semcon throws if no credentials can be determined
          }
        }

        if (this.isLoggedIn) {
          this.semconInfo = await semcon.getSemconInfo();
        }
      }
      catch {
        if (semcon.urls.baseUrl)
          this.message = `I'm not sure ${semcon.urls.baseUrl} is the correct endpoint I should connect to. Please check this again.`;
        else
          this.message = `I could not find any endpoint to connect to.`
      }

      this.isInitializing = false;
    },
    logIn(credentials: LoginData) {
      this.tryInitializeSemcon(credentials);
    },
    logOut() {
      this.isLoggedIn = false;
      SemconWeb.clearAuthentication();
    },
    showLoginForm() {
      this.isLoggedIn = false;
    },
  },
  computed: {
    hasMessage(): boolean {
      return !!this.message;
    },
    isLoginFormShowed(): boolean {
      return !this.isInitializing && !this.isLoggedIn;
    },
    title(): string {
      return this.semconInfo?.name || 'OYD-DataBud';
    },
    description(): string | undefined {
      return this.semconInfo?.description;
    },
    state(): IStore {
      return this.$store.state as IStore;
    },
    isUiFluid(): boolean {
      return this.state.ui.isFluid;
    },
    identityProviders(): (OAuthSupport | OAuthIdentityProvider | OAuthExternalProvider)[] | undefined {
      return this.semconSupport?.oAuth;
    },
    hasLogout(): boolean {
      return (this.semconSupport?.authentication === true && this.isLoggedIn)
        || (this.semconSupport?.authenticationMode === 'optional' && !!this.semconSupport.user);
    },
    additionalNavBarActions(): Action[] {
      const actions: Action[] = [];
      if (this.semconSupport?.authenticationMode === 'optional') {
        if (this.semconSupport.user) {
          actions.push({
            key: 'user-profile',
            method: ActionMethod.HREF,
            title: this.semconSupport.user.fullName,
            url: '/soya/user',
            usesAuth: true,
          });
        } else {
          actions.push({
            key: 'login',
            method: ActionMethod.INTERNAL,
            title: 'Login',
            url: '',
            usesAuth: false,
          });

          actions.push({
            key: 'user-register',
            method: ActionMethod.HREF,
            title: 'Register',
            url: '/soya/register',
            usesAuth: false,
          });
        }
      }

      return actions;
    },
  },
  watch: {
    title() {
      document.title = this.title;
    }
  }
});
</script>

<style>
.list-group-item {
  text-overflow: ellipsis;
  word-wrap: initial;
}

.list-group-item:not(.list-group-item--nolink) {
  cursor: pointer;
}
</style>
