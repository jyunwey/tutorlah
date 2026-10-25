<script setup>
import { computed } from "vue";

const props = defineProps({
  tutor: {
    type: Object,
    required: true,
  },
  // 0-100, or null while the compatibility score is not built yet.
  compatibility: {
    type: Number,
    default: null,
  },
});

defineEmits(["view-profile"]);

// Initials avatar replaces the profile photo.
const initials = computed(
  () => props.tutor.firstName[0] + props.tutor.lastName[0]
);
</script>

<template>
  <article class="tutor-card">
    <div class="avatar" aria-hidden="true">{{ initials }}</div>

    <div class="details">
      <h3>{{ tutor.firstName }} {{ tutor.lastName }}</h3>

      <!-- Seeded rating, since reviews are not implemented. -->
      <p class="rating">★ {{ tutor.rating.toFixed(1) }}</p>

      <p>{{ tutor.levels.join(", ") }} · {{ tutor.subjects.join(", ") }}</p>

      <p>${{ tutor.hourlyRate }}/hr • {{ tutor.location }}</p>

      <ul class="tags">
        <li v-for="style in tutor.teachingStyles" :key="style">
          {{ style }}
        </li>
      </ul>
    </div>

    <!-- FR-011 -->
    <div class="match">
      <p class="match-value">
        {{ compatibility === null ? "--" : compatibility }}%
      </p>
      <p class="match-label">Match</p>
    </div>

    <div class="actions">
      <button type="button" @click="$emit('view-profile', tutor.id)">
        View Profile
      </button>
      <!-- The Apply button (FR-009) is added in Sprint 2. -->
    </div>
  </article>
</template>

<style scoped>
.tutor-card {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: white;
  border-radius: 12px;
}

.avatar {
  display: grid;
  place-items: center;
  width: 96px;
  height: 96px;
  border-radius: 12px;
  background: #dde7f5;
  font-size: 1.75rem;
  font-weight: 600;
}

.details {
  display: grid;
  gap: 4px;
}

.details h3,
.details p {
  margin: 0;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 6px 0 0;
  padding: 0;
  list-style: none;
}

.tags li {
  padding: 4px 10px;
  border-radius: 999px;
  background: #eee;
  font-size: 0.85rem;
}

.match {
  text-align: center;
}

.match p {
  margin: 0;
}

.match-value {
  font-size: 1.5rem;
  font-weight: 600;
}

.actions button {
  padding: 10px 16px;
  font: inherit;
  cursor: pointer;
}

@media (max-width: 720px) {
  .tutor-card {
    grid-template-columns: auto 1fr;
  }
}
</style>
