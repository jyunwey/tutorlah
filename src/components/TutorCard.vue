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
    <header class="card-header">
      <div class="avatar" aria-hidden="true">{{ initials }}</div>

      <div>
        <h3>{{ tutor.firstName }} {{ tutor.lastName }}</h3>
        <!-- Seeded rating, since reviews are not implemented. -->
        <p class="rating">★ {{ tutor.rating.toFixed(1) }}</p>
      </div>

      <!-- FR-011 -->
      <p class="compatibility">
        {{ compatibility === null ? "--" : compatibility }}% match
      </p>
    </header>

    <dl class="details">
      <dt>Subjects</dt>
      <dd>{{ tutor.subjects.join(", ") }}</dd>

      <dt>Levels</dt>
      <dd>{{ tutor.levels.join(", ") }}</dd>

      <dt>Location</dt>
      <dd>{{ tutor.location }}</dd>

      <dt>Rate</dt>
      <dd>${{ tutor.hourlyRate }}/hr</dd>
    </dl>

    <ul class="tags">
      <li v-for="style in tutor.teachingStyles" :key="style">
        {{ style }}
      </li>
    </ul>

    <button type="button" @click="$emit('view-profile', tutor.id)">
      View Profile
    </button>
  </article>
</template>

<style scoped>
.tutor-card {
  display: grid;
  gap: 14px;
  padding: 20px;
  background: white;
  border-radius: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-header h3,
.card-header p {
  margin: 0;
}

.avatar {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #dde7f5;
  font-weight: 600;
}

.compatibility {
  margin-left: auto !important;
  font-weight: 600;
}

.details {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 12px;
  margin: 0;
}

.details dt {
  color: #666;
}

.details dd {
  margin: 0;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tags li {
  padding: 4px 10px;
  border-radius: 999px;
  background: #eee;
  font-size: 0.85rem;
}

button {
  padding: 10px;
  font: inherit;
  cursor: pointer;
}
</style>
