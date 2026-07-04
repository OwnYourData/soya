<template>
  <b-button
    :variant="computedType"
    @click="click"
  >
    <template v-if="type === 'refresh'">
      <b-icon
        icon="arrow-clockwise"
        aria-label="Refresh"
      ></b-icon>
      <slot />
    </template>
    <slot v-else />
  </b-button>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  props: {
    type: {
      type: String,
      default: 'primary'
    }
  },
  methods: {
    click() {
      this.$emit('click', ...arguments);
    }
  },
  computed: {
    computedType() {
      return this.type === 'refresh' ? 'outline-primary' : this.type;
    }
  }
})
</script>