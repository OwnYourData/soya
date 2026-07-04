<template>
  <pre class="card">{{ jsonContent }}</pre>
</template>

<style scoped>
.card {
  padding: 1em;

  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.card:hover {
  overflow: auto;
  text-overflow: clip;
}
</style>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  props: [
    'data',
  ],
  computed: {
    jsonContent(): string {
      if (typeof this.data === 'object')
        return JSON.stringify(this.data, null, 2).trim();

      return this.data;
    }
  }
})
</script>