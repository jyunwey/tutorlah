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

// e.g. "Ex-MOE Teacher | 6 years experience".
// Both fields are optional, so show whichever the tutor has filled in.
const credentials = computed(() => {
  const { qualification, yearsOfExperience } = props.tutor;
  const parts = [];

  if (qualification) {
    parts.push(qualification);
  }

  if (typeof yearsOfExperience === "number") {
    parts.push(
      `${yearsOfExperience} ${yearsOfExperience === 1 ? "year" : "years"} experience`
    );
  }

  return parts.join(" | ");
});
</script>

<template>
  <article class="tutor-card">
    <div class="avatar" aria-hidden="true">{{ initials }}</div>

    <div class="details">
      <h3>{{ tutor.firstName }} {{ tutor.lastName }}</h3>

      <!-- Seeded rating, since reviews are not implemented. -->
      <p class="rating">
        <span class="star" aria-hidden="true">★</span>
        {{ tutor.rating.toFixed(1) }}
      </p>

      <p v-if="credentials">{{ credentials }}</p>

      <p>{{ tutor.levels.join(", ") }} · {{ tutor.subjects.join(", ") }}</p>

      <p>${{ tutor.hourlyRate }}/hr • {{ tutor.location }}</p>

      <ul class="tags">
        <li v-for="style in tutor.teachingStyles" :key="style">
          {{ style }}
        </li>
      </ul>
    </div>

    <!-- FR-011: the ring fills to the compatibility percentage. -->
    <div class="match">
      <div
        class="match-ring"
        :style="{ '--percent': compatibility ?? 0 }"
      >
        <span class="match-value">
          {{ compatibility === null ? "--" : compatibility }}%
        </span>
      </div>
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
  gap: 24px;
  padding: 20px 24px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  transition: box-shadow 0.15s ease;
}

.tutor-card:hover {
  box-shadow: var(--shadow-card-hover);
}

.avatar {
  display: grid;
  place-items: center;
  width: 104px;
  height: 104px;
  border-radius: 12px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 2rem;
  font-weight: 700;
}

.details {
  display: grid;
  gap: 4px;
  color: var(--color-text-muted);
}

.details h3,
.details p {
  margin: 0;
}

.details h3 {
  color: var(--color-text);
  font-size: 1.2rem;
  font-weight: 700;
}

.rating {
  color: var(--color-text);
}

.star {
  color: var(--color-star);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}

.tags li {
  padding: 5px 12px;
  border-radius: 999px;
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  font-size: 0.85rem;
  font-weight: 500;
}

.match {
  display: grid;
  justify-items: center;
  gap: 6px;
}

/* A conic gradient draws the filled part of the ring;
   the white .match-value circle on top turns it into a ring. */
.match-ring {
  display: grid;
  place-items: center;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: conic-gradient(
    var(--color-primary) calc(var(--percent) * 1%),
    var(--color-ring-track) 0
  );
}

.match-value {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 1.35rem;
  font-weight: 700;
}

.match-label {
  margin: 0;
  color: var(--color-text-muted);
}

.actions button {
  min-width: 140px;
  padding: 12px 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-surface-muted);
  color: var(--color-text);
  font: inherit;
  font-weight: 500;
  cursor: pointer;
}

.actions button:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.actions button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Phones: avatar and details on top, then the match ring, then the button. */
@media (max-width: 640px) {
  .tutor-card {
    grid-template-columns: auto 1fr;
    gap: 16px;
    padding: 16px;
  }

  .avatar {
    width: 64px;
    height: 64px;
    font-size: 1.25rem;
  }

  .match {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .actions {
    grid-column: 1 / -1;
  }

  .actions button {
    width: 100%;
  }
}
</style>
