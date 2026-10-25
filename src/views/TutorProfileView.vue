<script setup>
import {
  computed,
  onMounted,
  ref,
} from "vue";
import {
  RouterLink,
  useRoute,
  useRouter,
} from "vue-router";

import MatchRing from "../components/MatchRing.vue";
import { fetchTutor } from "../services/tutors.js";
import { getCompatibility } from "../utils/compatibility.js";
import { filtersFromQuery } from "../utils/filterQuery.js";
import {
  formatCredentials,
  getInitials,
} from "../utils/tutorDisplay.js";

// FR-013: a tutor's public profile. It only reads tutorProfiles,
// so no email or phone number can appear here (NFR-007).

const route = useRoute();
const router = useRouter();

const tutor = ref(null);
const isLoading = ref(true);
const errorMessage = ref("");

// Vue Router remembers the previous page. If it was Find Tutors, "Back to
// Results" returns to that exact URL, so the filters are still applied.
// Otherwise (e.g. the profile link was opened directly) it opens Find Tutors.
const previousPath = router.options.history.state.back;
const resultsPath =
  typeof previousPath === "string" && previousPath.startsWith("/find-tutors")
    ? previousPath
    : "/find-tutors";

// Same filters as the results page, so the match % is the same as on the card.
const filters = filtersFromQuery(router.resolve(resultsPath).query);

const compatibility = computed(() =>
  tutor.value ? getCompatibility(tutor.value, filters) : null
);

// Icon outlines (24x24) for the detail rows, matching the prototype.
const ICON_PATHS = {
  qualification: "M22 10 12 5 2 10l10 5 10-5Z M6 12v5c3 2 9 2 12 0v-5",
  subjects:
    "M4 19.5V5a2 2 0 0 1 2-2h14v16H6.5A2.5 2.5 0 0 0 4 19.5Zm0 0A2.5 2.5 0 0 0 6.5 22H20",
  rate:
    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z M15 9.5C15 8.1 13.7 7 12 7s-3 1-3 2.5 1.3 2 3 2.5 3 1.1 3 2.5-1.3 2.5-3 2.5-3-1.1-3-2.5 M12 5.5V7 M12 17v1.5",
  location:
    "M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
};

const detailRows = computed(() => {
  const { levels, subjects, hourlyRate, location } = tutor.value;

  return [
    { icon: "qualification", text: formatCredentials(tutor.value) },
    { icon: "subjects", text: `${levels.join(", ")} · ${subjects.join(", ")}` },
    { icon: "rate", text: `$${hourlyRate}/hr` },
    { icon: "location", text: location },
  ].filter((row) => row.text);
});

onMounted(async () => {
  try {
    tutor.value = await fetchTutor(route.params.id);
  } catch (error) {
    console.error("Failed to load tutor:", error);
    errorMessage.value = "Could not load this tutor. Please try again.";
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <!-- TODO (FR-005): navigation bar goes here once it is built. -->
  <main class="tutor-profile-page">
    <div class="container">
      <RouterLink :to="resultsPath" class="back-link">
        <span aria-hidden="true">←</span> Back to Results
      </RouterLink>

      <p v-if="isLoading" class="status">Loading tutor...</p>

      <p v-else-if="errorMessage" class="status error">
        {{ errorMessage }}
      </p>

      <div v-else-if="!tutor" class="status">
        <p class="status-title">Tutor not found</p>
        <p>This tutor may no longer be available.</p>
      </div>

      <article v-else class="profile-card">
        <header class="profile-header">
          <div class="avatar" aria-hidden="true">{{ getInitials(tutor) }}</div>

          <div class="summary">
            <h1>{{ tutor.firstName }} {{ tutor.lastName }}</h1>

            <!-- Seeded rating, since reviews are not implemented. -->
            <p class="rating">
              <span class="star" aria-hidden="true">★</span>
              {{ tutor.rating.toFixed(1) }}
              <span class="rating-max">/ 5</span>
            </p>

            <ul class="detail-list">
              <li v-for="row in detailRows" :key="row.icon">
                <svg
                  class="icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path :d="ICON_PATHS[row.icon]" />
                </svg>
                <span>{{ row.text }}</span>
              </li>
            </ul>
          </div>

          <!-- FR-011 -->
          <div class="match">
            <MatchRing :value="compatibility" :size="120" />
            <p class="match-label">Match</p>
          </div>
        </header>

        <!-- The Apply button (FR-009) goes here in Sprint 2. -->

        <ul class="tags">
          <li v-for="style in tutor.teachingStyles" :key="style">
            {{ style }}
          </li>
        </ul>

        <!-- Refined FR-013: About tab only; the Reviews tab is removed
             because reviews are not implemented. -->
        <div class="tabs" role="tablist">
          <button
            id="tab-about"
            type="button"
            role="tab"
            class="tab active"
            aria-selected="true"
            aria-controls="panel-about"
          >
            About
          </button>
        </div>

        <section
          id="panel-about"
          class="tab-panel"
          role="tabpanel"
          aria-labelledby="tab-about"
        >
          <h2>About Me</h2>
          <p v-if="tutor.bio">{{ tutor.bio }}</p>
          <p v-else class="muted">This tutor hasn't written a bio yet.</p>
        </section>
      </article>
    </div>
  </main>
</template>

<style scoped>
.tutor-profile-page {
  min-height: 100vh;
  padding: 32px 20px;
  box-sizing: border-box;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
}

.container {
  display: grid;
  gap: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.back-link {
  justify-self: start;
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}

.back-link:focus-visible,
.tab:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.profile-card {
  display: grid;
  gap: 24px;
  padding: 28px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.profile-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 28px;
}

.avatar {
  display: grid;
  place-items: center;
  width: 160px;
  height: 160px;
  border-radius: 14px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 3rem;
  font-weight: 700;
}

.summary {
  display: grid;
  gap: 8px;
}

.summary h1,
.summary p {
  margin: 0;
}

.summary h1 {
  font-size: 1.75rem;
  font-weight: 800;
}

.rating {
  font-size: 1.05rem;
}

.star {
  color: var(--color-star);
}

.rating-max {
  color: var(--color-text-muted);
}

.detail-list {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
  color: var(--color-text-muted);
}

.detail-list li {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  color: var(--color-primary);
}

.match {
  display: grid;
  justify-items: center;
  gap: 8px;
}

.match-label {
  margin: 0;
  color: var(--color-primary);
  font-size: 1.1rem;
  font-weight: 700;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tags li {
  padding: 6px 14px;
  border-radius: 999px;
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  font-size: 0.9rem;
  font-weight: 500;
}

.tabs {
  display: flex;
  gap: 24px;
  border-bottom: 1px solid var(--color-border);
}

.tab {
  margin-bottom: -1px;
  padding: 10px 4px;
  border: none;
  border-bottom: 3px solid transparent;
  background: none;
  color: var(--color-text-muted);
  font: inherit;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
}

.tab.active {
  border-bottom-color: var(--color-primary);
  color: var(--color-primary);
}

.tab-panel h2 {
  margin: 0 0 8px;
  font-size: 1.1rem;
}

.tab-panel p {
  margin: 0;
  line-height: 1.6;
}

.muted {
  color: var(--color-text-muted);
}

/* Loading, error and "Tutor not found" messages. */
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

.status .status-title {
  margin-bottom: 6px;
  color: var(--color-text);
  font-size: 1.1rem;
  font-weight: 600;
}

.error {
  color: var(--color-error);
}

/* Phones: avatar and match ring side by side, details underneath. */
@media (max-width: 640px) {
  .profile-card {
    padding: 20px;
  }

  .profile-header {
    grid-template-columns: auto auto;
    justify-content: space-between;
    gap: 20px;
  }

  .avatar {
    width: 96px;
    height: 96px;
    font-size: 2rem;
  }

  .summary {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}
</style>
