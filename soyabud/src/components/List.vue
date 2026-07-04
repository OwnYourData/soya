<template>
  <div>
    <inline-group>
      <custom-button
        :disabled="isLoading"
        type="refresh"
        @click="() => refresh()"
      ></custom-button>
      <slot name="header-end" />
    </inline-group>
    <div class="list-container">
      <spinner v-if="isLoading" />
      <b-list-group
        v-else
        class="list"
      >
        <slot>
          <b-list-group-item class="list-group-item--nolink">No items available</b-list-group-item>
        </slot>
      </b-list-group>
    </div>
    <div v-if="totalItems && page && pageItems">
      <div>
        <b-input-group
          class="d-flex justify-content-center"
          prepend="Page"
        >
          <b-form-input
            :disabled="isLoading"
            class="input-page"
            v-model="inputPage"
            type="number"
            @keypress="inputPageKeydown"
          />
        </b-input-group>
      </div>

      <b-pagination
        :disabled="isLoading"
        :total-rows="totalItems"
        :per-page="pageItems"
        v-model="page"
        @page-click="paginationPageChange"
        align="fill"
      >
      </b-pagination>
    </div>
  </div>
</template>

<script lang="ts">
import { BvEvent } from 'bootstrap-vue';
import Vue, { PropType } from 'vue';
import Spinner from './Spinner.vue';
import CustomButton from '../components/Button.vue';
import InlineGroup from '../components/InlineGroup.vue';

export interface RefreshObj {
  page?: number,
}

interface Data {
  page?: number,
  inputPage?: number,
}

export default Vue.extend({
  props: {
    isLoading: {
      type: Boolean as PropType<boolean>,
      default: false,
    },
    totalItems: Number as PropType<number | undefined>,
    currentPage: Number as PropType<number | undefined>,
    pageItems: Number as PropType<number | undefined>,
  },
  data: (): Data => ({
    page: undefined,
    inputPage: undefined,
  }),
  components: {
    Spinner,
    CustomButton,
    InlineGroup,
  },
  created() {
    this.page = this.currentPage;
  },
  watch: {
    currentPage() {
      this.page = this.currentPage;
    },
    page() {
      this.inputPage = this.page;
    }
  },
  methods: {
    changePage(page: number) {
      this.refresh(page);
    },
    paginationPageChange(_: BvEvent, page: number) {
      this.changePage(page);
    },
    refresh(page?: number) {
      this.$emit('refresh', {
        page,
      });
    },
    inputPageKeydown(event: KeyboardEvent) {
      if (this.inputPage && event.key === 'Enter')
        this.changePage(this.inputPage);
    }
  }
});

</script>

<style scoped>
.list-container {
  height: 250px;
  overflow-y: auto;
}

.list > * {
  overflow-x: hidden;
  text-overflow: ellipsis;
}

.input-page {
  max-width: 4em;
  text-align: center;

  appearance: textfield;
}
</style>