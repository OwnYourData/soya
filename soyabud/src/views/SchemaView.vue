<template>
  <div class="container">
    <div class="row">
      <div class="col-md-4">
        <list :isLoading="isVaultItemListLoading">
          <b-list-group-item
            v-for="item of vaultItems"
            :key="item.id"
            :active="item.id === selectedVaultItem.id"
            @click="() => selectVaultItem(item)"
          >
            {{item.id}}
          </b-list-group-item>
        </list>
      </div>
      <div class="col-md-8">
        <data-visualizer
          v-if="hasSelectedVaultItem"
          :showRawView="false"
          :item="selectedVaultItem"
        ></data-visualizer>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import { SemconItem, SemconMinMeta } from 'semcon-js';
import List from '../components/List.vue';
import DataVisualizer from '../components/DataVisualizer.vue';
import { IStore } from '@/store';
import { FetchState } from '@/store/fetch-state';
import { ActionType } from '@/store/action-type';

export default Vue.extend({
  props: {
    schemaDri: String as PropType<string>,
  },
  components: {
    DataVisualizer,
    List,
  },
  created() {
    this.initialize();
  },
  methods: {
    async initialize() {
      this.fetchVaultItems();
    },
    async selectVaultItem(item?: SemconMinMeta) {
      this.$store.dispatch(ActionType.FETCH_VAULT_ITEM, item);
    },
    async fetchVaultItems() {
      this.$store.dispatch(ActionType.FETCH_VAULT_ITEMS, { schema: { dri: this.schemaDri } });
    }
  },
  computed: {
    vaultItems(): SemconItem[] | undefined {
      return this.$store.state.vaultItem.all;
    },
    isVaultItemListLoading(): boolean {
      return (this.$store.state as IStore).vaultItem.allState === FetchState.FETCHING;
    },
    selectedVaultItem(): SemconItem | undefined {
      return (this.$store.state as IStore).vaultItem.current;
    },
    hasSelectedVaultItem(): boolean {
      return !!this.selectedVaultItem;
    },
  }
})
</script>