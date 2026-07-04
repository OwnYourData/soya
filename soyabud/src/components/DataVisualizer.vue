<template>
  <b-card no-body>
    <b-tabs
      pills
      card
      v-model="activeTabIndex"
    >
      <b-tab
        title="SOyA Structure"
        v-if="showRawView"
      >
        <raw-data
          :item="item"
          :language="language"
          :isSaving="isSaving"
          @save="saveVaultItem"
          @cancel="cancel"
        ></raw-data>
      </b-tab>
      <b-tab
        title="Form"
        v-if="hasSchema"
        lazy
      >
        <form-view
          :item="item"
          :schemaDri="schemaDri"
          :allowSelectSchema="true"
          :hasCancel="false"
          :isSaving="isSaving"
          @save="saveVaultItem"
        ></form-view>
      </b-tab>
    </b-tabs>
  </b-card>
</template>

<style scoped>
.flex-container {
  display: flex;
  align-items: center;
  margin-bottom: 2em;
}

.signature-logo {
  margin-right: 2em;
  max-width: 4em;
}

.sign-button {
  margin-left: auto;
}
</style>

<script lang="ts">
import Vue, { PropType } from 'vue';

import { SemconItem, SemconPostItem } from 'semcon-js';
import RawData from './RawData.vue';

import FormView from './FormView.vue';

import { ActionType } from '@/store/action-type';
import { IStore, MutationType } from '../store';

interface Data {
  isSaving: boolean;
  activeTabIndex: number;
}

export default Vue.extend({
  props: {
    item: Object as PropType<SemconItem | undefined>,
    showRawView: {
      default: true,
      type: Boolean as PropType<boolean>,
    },
  },
  data: (): Data => ({
    isSaving: false,
    activeTabIndex: 0,
  }),
  components: {
    RawData,
    FormView,
  },
  computed: {
    schemaDri(): string | undefined {
      return this.item?.dri;
    },
    hasSchema(): boolean {
      return !!this.schemaDri;
    },
    language() {
      return (this.$store.state as IStore).vaultItem.language;
    },
  },
  methods: {
    async saveVaultItem(item: SemconPostItem, onComplete?: () => void) {
      this.isSaving = true;

      try {
        await this.$store.dispatch(ActionType.UPDATE_VAULT_ITEM, item);
      } catch (e: any) {
        console.error(e);
        this.$bvToast.toast(e.message || "Unknown error", {
          title: "Error while saving item",
          variant: "danger",
          solid: true,
        });
      }

      this.isSaving = false;

      if (onComplete)
        // indicate saving is complete
        onComplete();
    },
    cancel() {
      this.$emit('cancel');
    },
  },
})
</script>