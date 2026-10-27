<script setup>
import AppNavBar from "../components/AppNavBar.vue";
import {
  computed,
  onMounted,
  ref,
  watch,
} from "vue";
import {
  useRoute,
  useRouter,
} from "vue-router";

import TutorCard from "../components/TutorCard.vue";
import TutorFilters from "../components/TutorFilters.vue";
import { createEmptyFilters } from "../constants/tutorFilters.js";
import { fetchTutors } from "../services/tutors.js";
import { getCompatibility } from "../utils/compatibility.js";
import {
  filtersFromQuery,
  filtersToQuery,
} from "../utils/filterQuery.js";

const route = useRoute();
const router = useRouter();

const tutors = ref([]);
const isLoading = ref(true);
const errorMessage = ref("");

// FR-013: the filters live in the URL (e.g. ?subject=Mathematics), so
// "Back to Results" on the Tutor Profile page brings them back.
const filters = ref(filtersFromQuery(route.query));

watch(filters, (newFilters) => {
  router.replace({ query: filtersToQuery(newFilters) });
});

// Phones only: the filters panel starts collapsed (see the CSS).
const showFilters = ref(false);

// Each ticked checkbox counts as one filter.
const activeFilterCount = computed(() => {
  const {
    subject,
    level,
    location,
    maxBudget,
    availability,
    teachingStyles,
  } = filters.value;

  return (
    [subject, level, location].filter(Boolean).length +
    (maxBudget === null ? 0 : 1) +
    availability.length +
    teachingStyles.length
  );
});

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

function clearFilters() {
  filters.value = createEmptyFilters();
}

// FR-008: View Profile opens the tutor's profile page (FR-013).
function viewProfile(tutorId) {
  router.push({
    name: "tutor-profile",
    params: { id: tutorId },
  });
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
  <main class="find-tutors-page">
    <div class="page-nav">
      <AppNavBar />
    </div>
    <header class="page-header">
      <h1>Find Tutors</h1>
      <p>Browse tutors based on your needs.</p>
    </header>

    <div class="layout">
      <!-- Phones only: shows or hides the filters panel. -->
      <button
        type="button"
        class="filters-toggle"
        aria-controls="tutor-filters"
        :aria-expanded="showFilters"
        @click="showFilters = !showFilters"
      >
        {{ showFilters ? "Hide filters" : "Show filters" }}
        <span v-if="activeFilterCount > 0" class="filter-count">
          {{ activeFilterCount }}
        </span>
      </button>

      <!-- FR-010 -->
      <div
        id="tutor-filters"
        class="filters-wrapper"
        :class="{ open: showFilters }"
      >
        <TutorFilters v-model="filters" />
      </div>

      <!-- FR-008 -->
      <section class="results">
        <p v-if="isLoading" class="status">Loading tutors...</p>

        <p v-else-if="errorMessage" class="status error">
          {{ errorMessage }}
        </p>

        <template v-else>
          <!-- aria-live: screen readers announce the new count when filters change. -->
          <p class="result-count" aria-live="polite">
            {{ filteredTutors.length }}
            {{ filteredTutors.length === 1 ? "tutor" : "tutors" }} found
          </p>

          <div v-if="filteredTutors.length === 0" class="status">
            <p class="empty-title">No tutors found</p>

            <template v-if="activeFilterCount > 0">
              <p>Try removing some filters.</p>

              <button
                type="button"
                class="clear-filters-button"
                @click="clearFilters"
              >
                Clear all filters
              </button>
            </template>
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
.page-nav {
  margin-bottom: 28px;
}

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

.clear-filters-button {
  margin-top: 16px;
  padding: 10px 18px;
  border: none;
  border-radius: var(--radius-control);
  background: var(--color-primary);
  color: white;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.clear-filters-button:hover {
  background: var(--color-primary-dark);
}

.error {
  color: var(--color-error);
}

/* Hidden on wider screens, where the filters are always beside the results. */
.filters-toggle {
  display: none;
}

.filter-count {
  display: inline-grid;
  place-items: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  box-sizing: border-box;
  border-radius: 999px;
  background: var(--color-primary);
  color: white;
  font-size: 0.8rem;
}

.filters-toggle:focus-visible,
.clear-filters-button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

@media (max-width: 860px) {
  .layout {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .page-header h1 {
    font-size: 2rem;
  }

  .filters-toggle {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 12px 16px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-control);
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }

  .filters-wrapper:not(.open) {
    display: none;
  }
}
</style>
