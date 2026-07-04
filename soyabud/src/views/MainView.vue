<template>
  <b-container :fluid="isUiFluid">

    <b-card no-body>
      <b-tabs
        pills
        card
        lazy
        @activate-tab="handleActivateTab"
      >
        <b-tab title="All Structures">
          <schema-view @showEditView="handleShowEditView"></schema-view>
        </b-tab>
        <b-tab
          title="Repos"
          v-if="hasRepoSupport"
        >
          <repo-view></repo-view>
        </b-tab>
      </b-tabs>
    </b-card>

    <div
      class="center"
      v-if="isVaultItemLoading"
    >
      <Spinner></Spinner>
    </div>
    <data-visualizer
      class="data-visualizer"
      v-if="hasSelectedVaultItem || showEditView"
      :item="selectedVaultItem"
      @cancel="cancel"
    ></data-visualizer>
  </b-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { IStore, MutationType } from '../store';
import DataVisualizer from '../components/DataVisualizer.vue';
import Spinner from '../components/Spinner.vue';
import SchemaView from '../components/SchemaView.vue';
import RepoView from '../components/RepoView.vue';
import { SemconItem, SemconMinMeta } from 'semcon-js';
import { FetchState } from '@/store/fetch-state';

import { getInstance } from '@/services';
import { ActionType } from '@/store/action-type';

interface Data {
  hasRepoSupport: boolean,
  showEditView: boolean,
}

export default Vue.extend({
  components: {
    DataVisualizer,
    Spinner,
    SchemaView,
    RepoView,
  },
  data: (): Data => ({
    hasRepoSupport: false,
    showEditView: false,
  }),
  async created() {
    this.hasRepoSupport = (await getInstance().getSemconSupport()).repos;
  },
  computed: {
    selectedVaultItem(): SemconItem | undefined {
      return this.state.vaultItem.current;
    },
    hasSelectedVaultItem(): boolean {
      return !!this.selectedVaultItem;
    },
    state(): IStore {
      return this.$store.state as IStore;
    },
    isVaultItemLoading(): boolean {
      return this.state.vaultItem.currentState == FetchState.FETCHING;
    },
    isUiFluid(): boolean {
      return this.state.ui.isFluid;
    }
  },
  methods: {
    handleShowEditView(isShown: boolean) {
      if (isShown)
        this.$store.commit(MutationType.SET_VAULT_ITEM, undefined);

      this.showEditView = isShown;
    },
    handleActivateTab() {
      this.$store.dispatch(ActionType.RESET_VAULT_ITEMS);
    },
    selectVaultItem(item: SemconMinMeta) {
      this.$store.dispatch(ActionType.FETCH_VAULT_ITEM, item);
    },
    cancel() {
      this.$store.commit(MutationType.SET_VAULT_ITEM, undefined);
      this.handleShowEditView(false);
    },
  }
})
</script>

<style scoped>
.center {
  display: flex;
  justify-content: center;
}

.data-visualizer {
  margin-top: 1em;
}
</style>