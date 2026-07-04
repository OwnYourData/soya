<template>
  <div class="row">
    <div class="col-md-4">
      <div class="top-container">
        <h3 class="heading">System</h3>
      </div>
      <raw-json :data="systemData" />
      <div class="top-container">
        <h3 class="heading">Meta</h3>
        <b-checkbox
          class="check"
          v-model="isMetaEditable"
        >Editable</b-checkbox>
      </div>
      <b-textarea
        v-if="isMetaEditable"
        v-model="editableMeta"
        rows="10"
        class="textarea"
      />
      <raw-json
        v-else
        :data="item.meta"
      />
    </div>
    <div class="col-md-8">
      <div class="top-container">
        <h3 class="heading">Content</h3>
        <b-checkbox
          class="check"
          v-model="isDataEditable"
        >Editable</b-checkbox>
        <inline-group class="top-bar">
          <b-dropdown
            v-if="isDataEditable"
            :disabled="!isYaml"
            text="Templates"
          >
            <b-dropdown-item
              v-for="template of Object.keys(templates)"
              :key="template"
              @click="selectTemplate(template)"
            >
              {{template}}
            </b-dropdown-item>
          </b-dropdown>

          <custom-button
            @click="cancel"
            type="danger"
            :disabled="isSaving"
          >
            Cancel
          </custom-button>
          <custom-button
            @click="save"
            :type="isSaving ? 'primary-outline' : undefined"
            v-if="isDataEditable || isMetaEditable"
            :disabled="isSaving"
          >
            <spinner v-if="isSaving" />
            <template v-else>
              Push
            </template>
          </custom-button>
        </inline-group>
      </div>

      <vue-monaco-editor
        v-if="isDataEditable"
        class="monaco"
        :language="monacoLanguage"
        v-model="editableData"
      />
      <raw-json
        v-else
        :data="item.data"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { SemconItem, SemconPostItem } from 'semcon-js';
import Vue, { PropType } from 'vue'
import RawJson from './RawJson.vue';
import CustomButton from './Button.vue';
import InlineGroup from './InlineGroup.vue';
import Spinner from './Spinner.vue';
import { Language } from '../store';
import { all as templates } from '../res/templates';

interface Data {
  isDataEditable: boolean;
  isMetaEditable: boolean;
  editableData: string;
  editableMeta: string;
  templates: { [name: string]: string };
}

export default Vue.extend({
  components: {
    RawJson,
    CustomButton,
    Spinner,
    InlineGroup,
  },
  props: {
    item: {
      type: Object as PropType<SemconItem>,
      default: () => ({
        data: undefined,
        meta: {},
      } as SemconPostItem),
    },
    isSaving: {
      type: Boolean as PropType<boolean>,
    },
    language: {
      type: String as PropType<Language | undefined>,
    },
  },
  data: (): Data => ({
    isDataEditable: false,
    isMetaEditable: false,
    editableData: '',
    editableMeta: '',
    templates,
  }),
  created() {
    this.resetEditableData();
  },
  methods: {
    resetEditableData() {
      this.editableData = this.tryJsonStringify(this.item.data);
      this.editableMeta = this.tryJsonStringify(this.item.meta);
    },
    tryJsonStringify(data: any) {
      if (typeof data === 'object')
        return JSON.stringify(data, null, 2);

      return data;
    },
    save() {
      const postItem: SemconPostItem = {
        ...this.item,
      };

      this.$emit('save', postItem);
    },
    cancel() {
      this.$emit('cancel');
    },
    selectTemplate(template: string) {
      const t = this.templates[template];
      if (!t)
        return;

      this.editableData = t + '\n' + this.editableData;
    }
  },
  watch: {
    editableData(value: string) {
      try {
        this.item.data = JSON.parse(value);
      } catch {
        // this is soyabud specific, as we also handle YAML values
        this.item.data = value;
      }
    },
    editableMeta(value: string) {
      try {
        this.item.meta = JSON.parse(value);
      } catch { /* */ }
    },
    item() {
      this.resetEditableData();
    },
  },
  computed: {
    systemData(): any {
      const copy = { ...this.item };
      // @ts-ignore
      delete copy.raw;
      // @ts-ignore
      delete copy.data;
      // @ts-ignore
      delete copy.meta;
      return copy;
    },
    monacoLanguage(): string {
      switch (this.language) {
        case Language.JSON_LD: return 'json';
        case Language.YAML: return 'yaml';
        default: return '';
      }
    },
    isYaml() {
      return this.language === Language.YAML;
    }
  }
});
</script>

<style scoped>
.top-container {
  display: flex;
  align-items: center;
  margin-bottom: 1em;
}

.check {
  margin-left: 1em;
}

.top-bar {
  margin-left: auto;
}

.textarea {
  font-family: monospace;
  font-size: 0.85em;
}

.monaco {
  max-height: 600px;
}
</style>