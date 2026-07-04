<template>
  <div class="row">
    <section class="col-md-4">
      <list
        :isLoading="isRepoListLoading"
        @refresh="fetchRepos"
      >
        <b-list-group-item
          v-for="item of repos"
          :key="item.id"
          :active="selectedRepo && item.id === selectedRepo.id"
          @click="() => selectRepo(item)"
        >{{item.name}}</b-list-group-item>
      </list>
    </section>
    <section class="col-md-8">
      <list
        :isLoading="isVaultItemListLoading"
        :totalItems="totalVaultItems"
        :currentPage="currentVaultPage"
        :pageItems="vaultPageItems"
        @refresh="fetchVaultItems"
      >
        <template v-slot:header-end>
          <custom-button
            type="danger"
            @click="deleteSelectedVaultItem"
            :disabled="isDeleteButtonDisabled"
          >Delete</custom-button>
        </template>

        <b-list-group-item
          v-for="item of vaultItems"
          :key="item.id"
          :active="selectedVaultItem && item.id === selectedVaultItem.id"
          @click="() => selectVaultItem(item)"
        >
          {{item.id}}
        </b-list-group-item>
      </list>
    </section>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { IFetchVaultItems, IStore } from '../store';
import List, { RefreshObj } from '../components/List.vue';
import CustomButton from '../components/Button.vue';
import { SemconItem, SemconMinMeta, SemconRepo } from 'semcon-js';
import { ActionType } from '@/store/action-type';
import { FetchState } from '@/store/fetch-state';

interface IData {
  selectedRepo?: SemconRepo,
}

export default Vue.extend({
  mounted() {
    this.initialize();
  },
  data: (): IData => ({
    selectedRepo: undefined,
  }),
  components: {
    List,
    CustomButton,
  },
  methods: {
    async initialize() {
      this.fetchRepos();
    },
    async selectRepo(item?: SemconRepo) {
      this.selectedRepo = item;

      this.fetchVaultItems();
    },
    async selectVaultItem(item?: SemconMinMeta) {
      this.$store.dispatch(ActionType.FETCH_VAULT_ITEM, item);
    },
    async fetchRepos() {
      this.selectedRepo = undefined;
      this.$store.dispatch(ActionType.FETCH_REPOS);
    },
    async fetchVaultItems(refreshObj?: RefreshObj) {
      const fetchObj: IFetchVaultItems = {
        repo: this.selectedRepo,
        page: refreshObj?.page,
      };

      this.$store.dispatch(ActionType.FETCH_VAULT_ITEMS, fetchObj);
    },
    async deleteSelectedVaultItem() {
      try {
        await this.$store.dispatch(ActionType.DELETE_VAULT_ITEM, this.selectedVaultItem);
        this.fetchRepos();
      } catch (e: any) {
        console.error(e);
        this.$bvToast.toast(e.message || 'Unknown error', {
          title: 'Error while deleting item',
          variant: 'danger',
          solid: true,
        });
      }
    },
  },
  computed: {
    store(): IStore {
      return this.$store.state as IStore;
    },
    repos(): SemconRepo[] | undefined {
      return this.store.repo.all;
    },
    isRepoListLoading(): boolean {
      return this.store.repo.state === FetchState.FETCHING;
    },
    vaultItems(): SemconItem[] | undefined {
      return this.$store.state.vaultItem.all;
    },
    isVaultItemListLoading(): boolean {
      return (this.$store.state as IStore).vaultItem.allState === FetchState.FETCHING;
    },
    hasSelectedVaultItem(): boolean {
      return !!this.selectedVaultItem;
    },
    isDeleteButtonDisabled(): boolean {
      return !this.hasSelectedVaultItem;
    },
    selectedVaultItem(): SemconItem | undefined {
      return (this.$store.state as IStore).vaultItem.current;
    },
    currentVaultPage(): number | undefined {
      return (this.$store.state as IStore).vaultItem.paging?.current;
    },
    totalVaultItems(): number | undefined {
      return (this.$store.state as IStore).vaultItem.paging?.totalItems;
    },
    vaultPageItems(): number | undefined {
      return (this.$store.state as IStore).vaultItem.paging?.pageItems;
    }
  }
})
</script>