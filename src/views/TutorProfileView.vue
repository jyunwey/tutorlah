<script setup>
import {
  computed,
  onMounted,
  ref,
  watch
} from "vue";
import {
  RouterLink,
  useRoute,
  useRouter,
} from "vue-router";

import AppNavBar from "../components/AppNavBar.vue";
import MatchRing from "../components/MatchRing.vue";
import { useCurrentAccount } from "../composables/useCurrentAccount.js";
import { fetchTutor } from "../services/tutors.js";
import {
  buildCriteria,
  getCompatibility,
} from "../utils/compatibility.js";
import { filtersFromQuery } from "../utils/filterQuery.js";
import {
  formatCredentials,
  getInitials,
} from "../utils/tutorDisplay.js";
import {
  requestTutor,
  fetchMatchesWithTutor,
} from "../services/matches.js";

// FR-013: a tutor's public profile. It only reads tutorProfiles,
// so no email or phone number can appear here (NFR-007).

const route = useRoute();
const router = useRouter();

const tutor = ref(null);
const isLoading = ref(true);
const errorMessage = ref("");

const applied = ref(false);
// FR-022: this tutor rejected my request.
const rejected = ref(false);
const isApplying = ref(false);
const isCheckingApplication = ref(true);
const applicationError = ref("");
const applicationSuccess = ref("");
const applicationStatusError = ref(false);
// "matched": already matched with this tutor.
// "tutor-applied": this tutor applied to my assignment (FR-016) and is
// waiting for my answer.
// In both cases the student answers in My Matches instead of applying.
const relationship = ref("");

// Vue Router remembers the previous page. If it was Find Tutors, "Back to
// Results" returns to that exact URL, so the filters are still applied.
// Otherwise (e.g. the profile link was opened directly) it opens Find Tutors.
const previousPath = router.options.history.state.back;
const resultsPath =
  typeof previousPath === "string" && previousPath.startsWith("/find-tutors")
    ? previousPath
    : "/find-tutors";

const cameFromRequests =
  typeof previousPath === "string" && previousPath.startsWith("/my-matches");
const backPath = cameFromRequests ? previousPath : resultsPath;
const backLabel = cameFromRequests ? "Back to Requests" : "Back to Results";

// The signed-in user's account, for the navigation bar (FR-005) 
const { user, account } = useCurrentAccount();

// Same filters and preferences as the results page,
// so the match % is the same as on the tutor's card (FR-011).
const filters = filtersFromQuery(router.resolve(resultsPath).query);

const compatibility = computed(() => {
  if (!tutor.value) {
    return null;
  }

  const preferences =
    account.value?.role === "student" ? account.value : {};

  return getCompatibility(tutor.value, buildCriteria(filters, preferences));
});

async function handleApply() {
  if (
    !user.value ||
    !account.value ||
    !tutor.value ||
    applied.value ||
    relationship.value ||
    isApplying.value ||
    isCheckingApplication.value ||
    applicationStatusError.value 
  ) {
    return;
  }

  if (account.value.role !== "student") {
    applicationError.value =
      "Only students or parents can request tutors.";
    return;
  }

  applicationError.value = "";
  applicationSuccess.value = "";
  isApplying.value = true;

  try {
    await requestTutor(tutor.value, account.value);

    applied.value = true;
    applicationSuccess.value =
      "Your request has been sent successfully!";
  } catch (error) {
    console.error("Failed to request tutor:", error);

    applicationError.value =
      "Could not send your request. Please try again.";

  } finally {
    isApplying.value = false;
  }
}

// check whether the user has already applied, and prevents failed status check and overlapping requests
let applicationCheckId = 0;

watch(
  [user, account, tutor],
  async () => {
    const currentCheck = ++applicationCheckId;

    applied.value = false;
    rejected.value = false;
    relationship.value = "";
    applicationError.value = "";
    applicationStatusError.value = false;

    if (
      !user.value ||
      !account.value ||
      !tutor.value ||
      account.value.role !== "student"
    ) {
      isCheckingApplication.value = false;
      return;
    }

    isCheckingApplication.value = true;

    try {
      const matches = await fetchMatchesWithTutor(tutor.value.id);

      // Ignore outdated requests
      if (currentCheck !== applicationCheckId) return;

      // FR-009: I already sent this tutor a request.
      const myRequest = matches.find(
        (match) =>
          match.senderId === user.value.uid && !match.assignmentId
      );
      applied.value = Boolean(myRequest);
      rejected.value = myRequest?.status === "rejected";

      if (matches.some((match) => match.status === "accepted")) {
        relationship.value = "matched";
      } else if (
        matches.some(
          (match) =>
            match.senderId === tutor.value.id && match.status === "pending"
        )
      ) {
        relationship.value = "tutor-applied";
      }

    } catch (error) {
      if (currentCheck !== applicationCheckId) return;

      console.error("Could not check application:", error);

      applicationStatusError.value = true;
      applicationError.value =
        "Could not check your application status. Please refresh and try again.";

    } finally {
      if (currentCheck === applicationCheckId) {
        isCheckingApplication.value = false;
      }
    }
  },
  { immediate: true }
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
  lessonModes: "M3 4h18v12H3Z M8 20h8 M12 16v4",
};

const detailRows = computed(() => {
  if (!tutor.value) return [];
  const { levels, subjects, hourlyRate, location, lessonModes } = tutor.value;

  return [
    { icon: "qualification", text: formatCredentials(tutor.value) },
    { icon: "subjects", text: `${levels.join(", ")} · ${subjects.join(", ")}` },
    { icon: "rate", text: `$${hourlyRate}/hr` },
    { icon: "location", text: location },
    // FR-013 teaching mode, e.g. "In-person & Online".
    { icon: "lessonModes", text: (lessonModes ?? []).join(" & ") },
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
  <main class="tutor-profile-page">
    <!-- FR-005 -->
    <div class="nav-wrapper">
      <AppNavBar :account="account" />
    </div>

    <div class="container">
      <RouterLink :to="backPath" class="back-link">
        <span aria-hidden="true">←</span> {{ backLabel }}
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

        <!-- The Apply button (FR-020) goes here in Sprint 2. -->
        <div
          v-if="account?.role === 'student'"
          class="apply-section"
        >
          <!-- Already matched, or the tutor applied to my assignment:
               send the student to My Matches instead of letting them
               send a second request (FR-022). -->
          <p
            v-if="relationship === 'matched'"
            class="application-message info"
          >
            You're matched with {{ tutor.firstName }}.
            <RouterLink :to="{ name: 'my-matches' }">
              Chat in My Matches
            </RouterLink>
          </p>

          <p
            v-else-if="relationship === 'tutor-applied'"
            class="application-message info"
          >
            {{ tutor.firstName }} applied to your assignment.
            <RouterLink :to="{ name: 'my-matches', query: { tab: 'requests' } }">
              Accept or reject in My Matches
            </RouterLink>
          </p>

          <button
            v-else
            type="button"
            class="apply-btn"
            :class="{ rejected }"
            :disabled="applied || isApplying || isCheckingApplication || applicationStatusError"
            @click="handleApply"
          >
            {{
              rejected
                ? "Rejected"
                : applied
                  ? "Applied"
                  : isApplying
                    ? "Applying..."
                    : isCheckingApplication
                      ? "Checking..."
                      : "Apply"
            }}
          </button>

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
        </div>

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
.nav-wrapper {
  max-width: 1200px;
  margin: 0 auto 28px;
}

.tutor-profile-page {
  min-height: 100vh;
  padding: 24px 20px 32px;
  box-sizing: border-box;
  background: var(--page-background);
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

.apply-section {
  display: grid;
  gap: 12px;
}

.apply-btn {
  width: 100%;
  padding: 14px 20px;
  border: none;
  border-radius: var(--radius-control);
  background: var(--color-primary);
  color: white;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.apply-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.apply-btn:disabled {
  background: #e5e7eb;
  color: #6b7280;
  cursor: not-allowed;
}

/* FR-022: this tutor rejected my request. */
.apply-btn.rejected:disabled {
  background: #fdecea;
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

.application-message.info {
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  font-size: 15px;
}

.application-message.info a {
  color: inherit;
  font-weight: 600;
}

.application-message.info a:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
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
