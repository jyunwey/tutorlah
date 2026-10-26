<script setup>
defineProps({
  // 0-100, or null while the compatibility score is not built yet (FR-011).
  value: {
    type: Number,
    default: null,
  },
  // Outer diameter in pixels.
  size: {
    type: Number,
    default: 88,
  },
});
</script>

<template>
  <div
    class="match-ring"
    :style="{ '--percent': value ?? 0, '--size': `${size}px` }"
  >
    <span class="match-value">
      {{ value === null ? "--" : value }}%
    </span>
  </div>
</template>

<style scoped>
/* A conic gradient draws the filled part of the ring;
   the white .match-value circle on top turns it into a ring. */
.match-ring {
  display: grid;
  place-items: center;
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  background: conic-gradient(
    var(--color-primary) calc(var(--percent) * 1%),
    var(--color-ring-track) 0
  );
}

.match-value {
  display: grid;
  place-items: center;
  width: calc(var(--size) * 0.82);
  height: calc(var(--size) * 0.82);
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: calc(var(--size) * 0.24);
  font-weight: 700;
}
</style>
