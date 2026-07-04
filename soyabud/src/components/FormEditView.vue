<template>
  <div>
    <inline-group>
      <b-form
        inline
        @submit.prevent
        v-if="allowSelectSchema && (showTypeahead || !hasSelectedStructure)"
      >
        <b-typeahead
          prepend="Search SOyA structure..."
          v-model="editableText"
          :serializer="s => s.name"
          :data="suggestItems"
          @hit="selectFromTypeahead"
        >{{editableText}}</b-typeahead>
      </b-form>
      <b-button
        v-else
        @click="showTypeahead = true"
      >{{selectedStructureName}}</b-button>
      <div class="spacer"></div>
      <b-button
        v-if="iFrameSrc"
        :href="iFrameSrc"
        target="_blank"
        variant="success"
      >Open Permalink</b-button>
      <custom-button
        @click="saveEdit"
        :type="isSaving ? 'primary-outline' : undefined"
        :disabled="!hasSelectedStructure || isSaving"
      >
        <spinner v-if="isSaving" />
        <template v-else>
          Save
        </template>
      </custom-button>
      <custom-button
        v-for="action of actions"
        :key="action.key"
        @click="executeAction(action)"
        :type="isExecutingAction ? 'success-outline' : 'success'"
        :disabled="isExecutingAction"
      >
        <spinner v-if="isExecutingAction" />
        <template v-else>
          {{action.title}}
        </template>
      </custom-button>
      <custom-button
        v-if="hasCancel"
        @click="cancelEdit"
        type="danger"
      >Cancel</custom-button>
    </inline-group>

    <spinner v-if="isLoading" />
    <form-view
      :data="formData"
      :schemaDri="selectedStructure ? selectedStructure.dri : undefined"
      @change="onDataChange"
      @iFrameSrcChange="onIFrameSrcChange"
      ref="form"
    ></form-view>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';

import { SemconItem, SemconPostItem } from 'semcon-js';
import FormView from './FormView.vue';
import InlineGroup from './InlineGroup.vue';
import CustomButton from './Button.vue';
import Spinner from './Spinner.vue';
import { SoyaQueryResult } from 'soya-js';
import { IStore } from '@/store';
import { getInstance, soya } from '@/services';
import { Action, executeAction, getActionsFromConfig } from '@/utils/actions';

interface SoyaStructure {
  name?: string;
  dri: string;
}

interface Data {
  editableText?: string,
  selectedStructure?: SoyaStructure,
  suggestItems: SoyaQueryResult[],
  isLoading: boolean,
  isExecutingAction: boolean,
  showTypeahead: boolean,
  formData: any,
  iFrameSrc?: string,
}

export default Vue.extend({
  components: {
    FormView,
    CustomButton,
    InlineGroup,
    Spinner,
  },
  props: {
    schemaDri: String as PropType<string | undefined>,
    item: Object as PropType<SemconItem | undefined>,
    isSaving: {
      type: Boolean as PropType<boolean>,
      default: false,
    },
    hasCancel: {
      type: Boolean as PropType<boolean>,
      default: true
    },
    allowSelectSchema: {
      type: Boolean as PropType<boolean>,
      default: true,
    }
  },
  data: (): Data => ({
    editableText: '',
    selectedStructure: undefined,
    suggestItems: [],
    isLoading: false,
    isExecutingAction: false,
    showTypeahead: false,
    formData: undefined,
    iFrameSrc: undefined,
  }),
  mounted() {
    if (this.schemaDri)
      this.selectStructure({
        name: undefined,
        dri: this.schemaDri,
      });
  },
  methods: {
    async saveEdit() {
      if (!this.selectedStructure)
        return;

      const postItem: SemconPostItem = {
        data: this.formData,
        id: this.item?.id,
        meta: {
          schema: this.selectedStructure.dri,
        },
      };

      // promise ensures we really await the correct saving of the item
      await new Promise((resolve) => {
        this.$emit('save', postItem, resolve);
      });

      return true;
    },
    async executeAction(action: Action) {
      this.isExecutingAction = true;

      // TODO: await saveEdit does not work
      // if saving did not work, we do not execute vaccination
      if (this.item && await this.saveEdit())
        try {
          await executeAction(action, getInstance(), this, this.item);
        } catch (e) {
          console.error(e);
        }

      this.isExecutingAction = false;
    },
    cancelEdit(): void {
      this.$emit('cancel');
    },
    selectStructure(structure?: SoyaStructure) {
      this.selectedStructure = structure;

      if (structure && !structure.name) {
        const item = (this.$store.state as IStore).schemaDRI.all.find(x => x.dri === structure.dri);
        if (item)
          structure.name = item.title;
      }

      this.showTypeahead = false;
    },
    async selectFromTypeahead(result: SoyaQueryResult): Promise<void> {
      this.isLoading = true;

      this.selectStructure(result);

      this.isLoading = false;
    },
    onDataChange(event: { data: any }) {
      this.formData = event.data;
    },
    onIFrameSrcChange(src: string) {
      this.iFrameSrc = src;
    },
  },
  computed: {
    hasSelectedStructure(): boolean {
      return !!this.selectedStructure;
    },
    selectedStructureName(): string | undefined {
      return this.selectedStructure ? (this.selectedStructure.name || this.selectedStructure.dri) : undefined;
    },
    actions(): Action[] {
      return getActionsFromConfig('settings', 'additionalFormActions').filter(x => (x as any).schemaDri === this.schemaDri);
    }
  },
  watch: {
    item: {
      handler(value: SemconItem | undefined) {
        this.formData = value?.data;
      },
      immediate: true,
    },
    schemaDri(value?: string) {
      if (value)
        this.selectStructure({
          name: undefined,
          dri: value,
        });
      else
        this.selectStructure(undefined);
    },
    async editableText(value: string) {
      if (!value)
        this.suggestItems = [];
      // type at least 3 characters
      else if (value.length >= 3)
        this.suggestItems = await soya.query({ name: value });
    }
  }
})
</script>

<style scoped>
.spacer {
  flex: 1;
}
</style>