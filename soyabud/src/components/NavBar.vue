<template>
  <b-navbar
    toggleable="lg"
    type="dark"
    variant="dark"
  >
    <b-navbar-brand
      v-b-tooltip.hover.bottomright="description"
      @click="goHome"
      href="#"
    >{{title}}</b-navbar-brand>
    <b-nav-text>
      soyabud v{{version}}
    </b-nav-text>
    <b-nav-text v-if="url">
      <a :href="url">{{url}}</a>
    </b-nav-text>

    <b-navbar-nav class="ml-auto">
      <b-nav-item>
        <b-icon
          :icon="isUiFluid ? 'arrows-angle-contract': 'arrows-angle-expand'"
          @click="toggleUiFluid"
        />
      </b-nav-item>
      <b-nav-item-dropdown
        right
        v-if="actions && actions.length > 0"
        :disabled="!!workingAction"
      >
        <template #button-content>
          <b-icon
            icon="gear"
            :animation="gearAnimation"
            aria-label="Settings"
          ></b-icon>
          <span class="ml-2">{{workingActionTitle}}</span>
        </template>
        <b-dropdown-item
          href="#"
          v-for="act of actions"
          :key="act.key"
          @click="() => executeAction(act)"
        >{{act.title}}</b-dropdown-item>

      </b-nav-item-dropdown>
    </b-navbar-nav>
  </b-navbar>
</template>

<script lang="ts">
import { RoutePath } from '@/router';
import { getInstance } from '@/services';
import { IStore } from '@/store';
import { ActionType } from '@/store/action-type';
import { Action, ActionMethod, executeAction, getActionsFromConfig } from '../utils/actions';
import Vue, { PropType } from 'vue'

import { ConfigService, PACKAGE } from '../services/config-service';

interface Data {
  workingAction?: Action,
}
export default Vue.extend({
  props: {
    settingsActions: Array as PropType<string[]>,
    title: String as PropType<string>,
    description: String as PropType<string | undefined>,
    url: String as PropType<string | undefined>,
    hasLogout: Boolean as PropType<boolean | undefined>,
    additionalActions: Array as PropType<Action[] | undefined>,
  },
  data: (): Data => ({
    workingAction: undefined,
  }),
  methods: {
    async executeAction(action: Action) {
      this.workingAction = action;

      if (action.method === ActionMethod.INTERNAL)
        this.$emit(action.key, action);
      else
        await executeAction(action, getInstance(), this);

      this.workingAction = undefined;
    },
    goHome() {
      this.$router.push(RoutePath.MAIN_VIEW);
    },
    toggleUiFluid() {
      this.$store.dispatch(ActionType.TOGGLE_UI_IS_FLUID);
    }
  },
  computed: {
    version() {
      return PACKAGE.version;
    },
    actions(): Action[] {
      const actions = [
        ...(this.additionalActions ?? []),
        ...getActionsFromConfig('settings', 'actions'),
      ];

      if (this.hasLogout) {
        actions.push({
          key: 'logout',
          method: ActionMethod.INTERNAL,
          title: 'Logout',
          url: '',
          usesAuth: false,
        });
      }

      return actions;
    },
    gearAnimation() {
      return this.workingAction ? 'spin' : undefined;
    },
    workingActionTitle() {
      return this.workingAction?.title;
    },
    state(): IStore {
      return this.$store.state as IStore;
    },
    isUiFluid(): boolean {
      return this.state.ui.isFluid;
    }
  }
})
</script>

<style scoped>
.navbar {
  margin-bottom: 1em;
}

.navbar-text {
  margin-right: 1em;
}
</style>