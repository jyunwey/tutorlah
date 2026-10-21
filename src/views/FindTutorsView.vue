<script setup>
import {
  computed,
  onMounted,
  ref,
} from "vue";

import TutorCard from "../components/TutorCard.vue";
import TutorFilters from "../components/TutorFilters.vue";
import { createEmptyFilters } from "../constants/tutorFilters.js";
import { fetchTutors } from "../services/tutors.js";
import { getCompatibility } from "../utils/compatibility.js";

const tutors = ref([]);
const isLoading = ref(true);
const errorMessage = ref("");

// TODO (FR-013): keep the filters in the URL query so that
// "Back to Results" on the Tutor Profile page restores them.
const filters = ref(createEmptyFilters());

const filteredTutors = computed(() =>
  tutors.value.filter((tutor) =>
    matchesFilters(tutor, filters.value)
  )
);

// FR-010: a tutor is shown only if they match every filter
// that is set. An empty filter ("", null or []) matches every tutor.
// For checkbox filters, the tutor needs at least one of the ticked options.
function matchesFilters(tutor, activeFilters) {
  const {
    subject,
    level,
    location,
    maxBudget,
    availability,
    teachingStyles,
  } = activeFilters;

  if (subject && !tutor.subjects.includes(subject)) {
    return false;
  }

  if (level && !tutor.levels.includes(level)) {
    return false;
  }

  if (location && tutor.location !== location) {
    return false;
  }

  if (maxBudget !== null && tutor.hourlyRate > maxBudget) {
    return false;
  }

  if (
    availability.length > 0 &&
    !availability.some((slot) => tutor.availability.includes(slot))
  ) {
    return false;
  }

  if (
    teachingStyles.length > 0 &&
    !teachingStyles.some((style) => tutor.teachingStyles.includes(style))
  ) {
    return false;
  }

  return true;
}

// TODO (FR-013): navigate to the Tutor Profile page.
function viewProfile(tutorId) {
  console.log("View profile:", tutorId);
}

onMounted(async () => {
  try {
    tutors.value = await fetchTutors();
  } catch (error) {
    console.error("Failed to load tutors:", error);
    errorMessage.value = "Could not load tutors. Please try again.";
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <!-- TODO (FR-005): navigation bar goes here once it is built. -->
  <main class="find-tutors-page">
    <header class="page-header">
      <h1>Find Tutors</h1>
      <p>Browse tutors based on your needs.</p>
    </header>

    <div class="layout">
      <!-- FR-010 -->
      <TutorFilters v-model="filters" />

      <!-- FR-008 -->
      <section class="results">
        <p v-if="isLoading" class="status">Loading tutors...</p>

        <p v-else-if="errorMessage" class="status error">
          {{ errorMessage }}
        </p>

        <template v-else>
          <p class="result-count">
            {{ filteredTutors.length }}
            {{ filteredTutors.length === 1 ? "tutor" : "tutors" }} found
          </p>

          <div v-if="filteredTutors.length === 0" class="status">
            <p class="empty-title">No tutors found</p>
            <p>Try removing some filters.</p>
          </div>

          <div v-else class="card-list">
            <TutorCard
              v-for="tutor in filteredTutors"
              :key="tutor.id"
              :tutor="tutor"
              :compatibility="getCompatibility(tutor, filters)"
              @view-profile="viewProfile"
            />
          </div>
        </template>
      </section>
    </div>
  </main>
</template>

<style scoped>
.find-tutors-page {
  min-height: 100vh;
  padding: 40px 20px;
  box-sizing: border-box;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
}

.page-header {
  max-width: 1200px;
  margin: 0 auto 28px;
}

.page-header h1,
.page-header p {
  margin: 0;
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.page-header p {
  margin-top: 8px;
  color: var(--color-text-muted);
  font-size: 1.15rem;
}

.layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  align-items: start;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.results {
  display: grid;
  gap: 16px;
}

.result-count {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
}

.card-list {
  display: grid;
  gap: 16px;
}

/* Loading, error and "No tutors found" messages. */
.status {
  margin: 0;
  padding: 48px 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  color: var(--color-text-muted);
  text-align: center;
}

.status p {
  margin: 0;
}

.status .empty-title {
  margin-bottom: 6px;
  color: var(--color-text);
  font-size: 1.1rem;
  font-weight: 600;
}

.error {
  color: var(--color-error);
}

@media (max-width: 860px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .page-header h1 {
    font-size: 2rem;
  }
}
</style>
