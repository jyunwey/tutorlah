<script setup>
import {
  computed,
  onMounted,
  ref,
  watch,
} from "vue";
import {
  RouterLink,
  useRoute,
  useRouter,
} from "vue-router";

import AppNavBar from "../components/AppNavBar.vue";
import TutorCard from "../components/TutorCard.vue";
import TutorFilters from "../components/TutorFilters.vue";
import { useCurrentAccount } from "../composables/useCurrentAccount.js";
import { createEmptyFilters } from "../constants/tutorFilters.js";
import { fetchTutors } from "../services/tutors.js";
import {
  buildCriteria,
  getCompatibility,
} from "../utils/compatibility.js";
import {
  filtersFromQuery,
  filtersToQuery,
} from "../utils/filterQuery.js";
import {
  fetchSentRequests,
  requestTutor,
} from "../services/matches.js";

const route = useRoute();
const router = useRouter();

// Signed-in user's account for navigation and matching preferences.
const {
  user,
  account,
  isLoading: isAccountLoading,
} = useCurrentAccount();

const tutors = ref([]);
const isLoading = ref(true);
const errorMessage = ref("");

const appliedTutorIds = ref([]);
const applyingTutorIds = ref([]);
const applicationError = ref("");
const applicationSuccess = ref("");

const isCheckingApplications = ref(false);
const applicationStatusError = ref(false);

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

// FR-011: what each tutor is scored against. Uses the filters first,
// then the student's saved preferences; tutors have no preferences.
const criteria = computed(() =>
  buildCriteria(
    filters.value,
    account.value?.role === "student" ? account.value : {}
  )
);

// Best match first, like the prototype. Tutors without a score go last.
const rankedTutors = computed(() =>
  filteredTutors.value
    .map((tutor) => ({
      tutor,
      compatibility: getCompatibility(tutor, criteria.value),
    }))
    .sort((a, b) => (b.compatibility ?? -1) - (a.compatibility ?? -1))
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

// FR-020: student requests a tutor
async function handleApply(tutor) {
  // don't allow applying while checking existing requests
  if (
    isCheckingApplications.value ||
    applicationStatusError.value
  ) {
    return;
  }

  if (!user.value || !account.value) {
    applicationError.value = "Please log in before applying.";
    return;
  }

  if (account.value.role !== "student") {
    applicationError.value =
      "Only students or parents can request tutors.";
    return;
  }

  if (
    appliedTutorIds.value.includes(tutor.id) ||
    applyingTutorIds.value.includes(tutor.id)
  ) {
    return;
  }

  applicationError.value = "";
  applicationSuccess.value = "";

  applyingTutorIds.value.push(tutor.id);

  try {
    await requestTutor(tutor, account.value);

    appliedTutorIds.value.push(tutor.id);

    applicationSuccess.value =
      `Your request to ${tutor.firstName} ${tutor.lastName} has been sent!`;

  } catch (error) {
    console.error("Failed to apply:", error);

    applicationError.value =
      "Could not send your request. Please try again.";

  } finally {
    applyingTutorIds.value =
      applyingTutorIds.value.filter((id) => id !== tutor.id);
  }
}

// FR-020: Load tutors the student has already requested
async function loadAppliedTutors() {
  if (!user.value || account.value?.role !== "student") {
    appliedTutorIds.value = [];
    isCheckingApplications.value = false;
    applicationStatusError.value = false;
    return;
  }

  isCheckingApplications.value = true;
  applicationStatusError.value = false;

  try {
    const sentRequests = await fetchSentRequests();

    appliedTutorIds.value = sentRequests
      .filter((match) =>
        match.studentId === user.value.uid &&
        match.senderId === user.value.uid &&
        !match.assignmentId
      )
      .map((match) => match.tutorId);

  } catch (error) {
    console.error("Failed to load applications:", error);

    applicationStatusError.value = true;
    applicationError.value =
      "Could not load application statuses. Please refresh and try again.";

  } finally {
    isCheckingApplications.value = false;
  }
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

watch(
  [user, account, tutors],
  async () => {
    if (
      !user.value ||
      !account.value ||
      tutors.value.length === 0
    ) {
      appliedTutorIds.value = [];
      return;
    }

    await loadAppliedTutors();
  },
  { immediate: true }
);
</script>

<template>
  <main class="find-tutors-page">
    <!-- FR-005 -->
    <div class="nav-wrapper">
      <AppNavBar :account="account" />
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
        <p
          v-if="applicationSuccess"
          class="application-message success"
          role="status"
        >
          {{ applicationSuccess }}
        </p>

        <p
          v-if="applicationError"
          class="application-message error"
          role="alert"
        >
          {{ applicationError }}
        </p>

        <p v-if="isLoading || isAccountLoading" class="status">
          Loading tutors...
        </p>

        <p v-else-if="!user" class="status">
          Please sign in to see tutors.
          <RouterLink to="/register">Create an account</RouterLink>
        </p>

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
              v-for="{ tutor, compatibility } in rankedTutors"
              :key="tutor.id"
              :tutor="tutor"
              :compatibility="compatibility"
              :applied="appliedTutorIds.includes(tutor.id)"
              :is-applying="applyingTutorIds.includes(tutor.id)"
              :disabled="isCheckingApplications || applicationStatusError || account?.role !== 'student'"
              @view-profile="viewProfile"
              @apply="handleApply"
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
  padding: 24px 20px 40px;
  box-sizing: border-box;
  background: var(--page-background);
  color: var(--color-text);
  font-family: var(--font-sans);
}

.nav-wrapper {
  max-width: 1200px;
  margin: 0 auto 32px;
}

.page-header {
  max-width: 1200px;
  margin: 0 auto 28px;
}

.status a {
  color: var(--color-primary);
  font-weight: 600;
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

.application-message {
  margin: 0;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
}

.application-message.success {
  background: #e4fff3;
  color: #00875a;
}

.application-message.error {
  background: #fdecec;
  color: #c62828;
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
