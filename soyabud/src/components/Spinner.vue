<template>
  <b-spinner
    type="grow"
    :variant="variant"
    :small="small"
  ></b-spinner>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  props: {
    variant: {
      default: 'dark',
    },
    small: {
      default: false,
    }
  }
});
</script>