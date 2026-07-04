<template>
  <div class="inline-group">
    <slot />
  </div>
</template>

<style scoped>
.inline-group {
  display: flex;
  align-items: center;
  margin-bottom: 1em;
}

.inline-group > :not(:last-child) {
  margin-right: 1em;
}
</style>