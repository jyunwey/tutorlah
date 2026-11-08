<script setup>
import { computed } from "vue";

import MatchRing from "./MatchRing.vue";
import {
  formatCredentials,
  getInitials,
} from "../utils/tutorDisplay.js";

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
  applied: {
    type: Boolean,
    default: false,
  },
  // FR-022: the tutor rejected my request.
  rejected: {
    type: Boolean,
    default: false,
  },
  isApplying: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["view-profile", "apply"]);

const initials = computed(() => getInitials(props.tutor));
const credentials = computed(() => formatCredentials(props.tutor));
</script>

<template>
  <article class="tutor-card">
    <div class="avatar" aria-hidden="true">{{ initials }}</div>

    <div class="details">
      <h3>{{ tutor.firstName }} {{ tutor.lastName }}</h3>

      <p v-if="credentials">{{ credentials }}</p>

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
      <MatchRing :value="compatibility" />
      <p class="match-label">Match</p>
    </div>

    <div class="actions">
      <button type="button" @click="$emit('view-profile', tutor.id)">
        View Profile
      </button>
      <!-- The Apply button (FR-009) is added in Sprint 2. -->
      <button
        type="button"
        class="apply-btn"
        :class="{ rejected }"
        :disabled="disabled || applied || rejected || isApplying"
        @click="$emit('apply', tutor)"
      >
        {{
          rejected
            ? "Rejected"
            : applied
              ? "Applied"
              : isApplying
                ? "Applying..."
                : "Apply"
        }}
      </button>
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

.actions {
  display: grid;
  gap: 10px;
}

.actions .apply-btn {
  background: #00875a;
  color: white;
  border-color: #00875a;
  font-weight: 600;
}

.actions .apply-btn:hover:not(:disabled) {
  background: #006b47;
  color: white;
}

.actions .apply-btn:disabled {
  background: #e5e7eb;
  color: #6b7280;
  border-color: #e5e7eb;
  cursor: not-allowed;
}

/* FR-022: the tutor rejected this request. */
.actions .apply-btn.rejected:disabled {
  background: #fdecea;
  color: var(--color-error);
  border-color: #fdecea;
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
