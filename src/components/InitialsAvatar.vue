<script setup>
// Initials avatar used on My Matches; it replaces the profile photo.
defineProps({
  person: {
    type: Object,
    required: true,
  },
  size: {
    type: Number,
    default: 56,
  },
});
</script>

<template>
  <div
    class="avatar"
    :style="{ '--size': `${size}px` }"
    aria-hidden="true"
  >
    {{ (person.firstName?.[0] ?? "") + (person.lastName?.[0] ?? "") }}
  </div>
</template>

<style scoped>
.avatar {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: var(--size);
  height: var(--size);
  border-radius: 12px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: calc(var(--size) * 0.36);
  font-weight: 700;
}
</style>
