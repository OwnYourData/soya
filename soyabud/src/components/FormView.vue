<template>
  <div>
    <spinner v-if="isLoading" />
    <!-- p-0 removes padding -->
    <b-container
      v-show="hasSchemaDri"
      class="p-0"
    >
      <b-row>
        <b-col>
          <b-form
            class="form"
            ref="form"
            @submit.prevent
          >
            <!-- While loading, we only make the iframe transparent -->
            <!-- Because if we make it invisible, it will stop loading -->
            <iframe
              ref="iframe"
              class="iframe"
              :class="{'transparent': isLoading}"
              :src="iFrameSrc"
            />
          </b-form>
        </b-col>
      </b-row>
    </b-container>
    <b-alert
      variant="primary"
      v-if="!hasSchemaDri"
      show
    >
      Please select a form.
    </b-alert>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Spinner from './Spinner.vue';

interface Data {
  selectedLanguage: string | null,
  selectedTag: string | null,
  isLoading: boolean,
  iFrameSrc: string | null,
}

export default Vue.extend({
  data: (): Data => ({
    selectedLanguage: null,
    selectedTag: null,
    isLoading: false,
    iFrameSrc: null,
  }),
  props: {
    data: {
      type: Object,
      required: false,
      default: () => ({}),
    },
    schemaDri: String,
  },
  components: {
    Spinner,
  },
  mounted() {
    window.addEventListener('message', (evt: MessageEvent) => {
      // ignore all messages that are created from this window
      if (evt.source === window)
        return;

      const iframe = this.iframe;

      switch (evt.data?.type) {
        case 'update':
          if (this.isLoading) {
            this.isLoading = false;
            // now set data for the first time
            // as we don't pass it via URL query parameter
            this.setData();
          }
          if (iframe)
            iframe.style.height = evt.data.documentHeight + 'px';
          break;
        case 'data':
          // only receive data updates, if the view is not in loading state
          // otherwise the data update coming from soya form might override
          // our internal data, which has not yet been posted to the soya form
          // and would therefore be lost
          if (!this.isLoading) {
            this.$emit('change', evt.data.evt);
          }
          break;
      }
    });

    this.reload();
  },
  methods: {
    async reload() {
      if (!this.schemaDri)
        return;

      this.isLoading = true;

      const { searchParams: windowParams } = new URL(window.location.href);
      // one can specify a different form url via URL params
      const url = new URL(windowParams.get('FORM_URL') || 'https://soya-form.ownyourdata.eu');
      const { searchParams: params } = url;

      params.append('viewMode', 'embedded');
      params.append('schemaDri', this.schemaDri);

      this.iFrameSrc = url.toString();
    },
    setData() {
      this.iframe?.contentWindow?.postMessage({
        type: 'data',
        data: this.data,
      }, '*');
    },
  },
  watch: {
    schemaDri() {
      this.reload();
    },
    data() {
      this.setData();
    },
    iFrameSrc() {
      this.$emit('iFrameSrcChange', this.iFrameSrc);
    }
  },
  computed: {
    hasSchemaDri(): boolean {
      return !!this.schemaDri;
    },
    iframe(): HTMLIFrameElement | undefined {
      return this.$refs.iframe as unknown as HTMLIFrameElement;
    }
  },
})
</script>

<style scoped>
.soya-form-option {
  max-width: 12em;
}

.iframe {
  width: 100%;
  min-height: 500px;

  border: none;
}

.transparent {
  opacity: 0;
}
</style>