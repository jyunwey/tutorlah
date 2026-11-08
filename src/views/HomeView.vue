<script setup>
import { computed, ref, watch } from "vue";
import { RouterLink, useRouter } from "vue-router";

import AppNavBar from "../components/AppNavBar.vue";
import AssignmentCard from "../components/AssignmentCard.vue";
import TutorCard from "../components/TutorCard.vue";
import { useCurrentAccount } from "../composables/useCurrentAccount.js";
import { fetchAssignments } from "../services/assignments.js";
import { fetchTutor, fetchTutors } from "../services/tutors.js";
import {
  recommendAssignments,
  recommendTutors,
} from "../utils/recommendations.js";
import {
  fetchSentRequests,
  requestTutor,
} from "../services/matches.js";


const router = useRouter();
const { user, account, isLoading, errorMessage } = useCurrentAccount();

const isTutor = computed(() => account.value?.role === "tutor");
const needsProfile = computed(
  () => Boolean(account.value) && !account.value.onboardingComplete,
);

watch(
  needsProfile,
  (needed) => {
    if (needed) router.replace("/create-profile");
  },
  { immediate: true },
);

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
});

const subtitle = computed(() =>
  isTutor.value
    ? "Find the right students. Grow your teaching together."
    : "Find the right tutor. Achieve your goals together.",
);

const FEATURES = [
  {
    title: "Smart Matching",
    text: "Find the right fit for your goals",
    icon: "match",
  },
  {
    title: "Verified Profiles",
    text: "Learn and teach with confidence",
    icon: "shield",
  },
  {
    title: "Flexible Learning",
    text: "In-person or online",
    icon: "calendar",
  },
  {
    title: "Support Local",
    text: "Build a stronger learning community",
    icon: "community",
  },
];

const recommendation = computed(() =>
  isTutor.value
    ? {
        title: "Recommended Assignments For You",
        seeAllPath: "/find-assignments",
        emptyText:
          "Assignments that match your subjects, levels and schedule will appear here.",
      }
    : {
        title: "Recommended Tutors For You",
        seeAllPath: "/find-tutors",
        emptyText:
          "Tutors that match your learning needs will appear here.",
      },
);

const canSeeAll = computed(() =>
  router
    .getRoutes()
    .some((route) => route.path === recommendation.value.seeAllPath),
);

const recommendations = ref([]);
const isLoadingRecommendations = ref(false);
const recommendationError = ref("");

// FR-020: Application status for recommended tutors
const appliedTutorIds = ref([]);
const applyingTutorIds = ref([]);
const isCheckingApplications = ref(false);
const applicationStatusError = ref(false);
const applicationError = ref("");
const applicationSuccess = ref("");

let applicationCheckId = 0;
let recommendationRequest = 0;

watch(
  account,
  async (currentAccount) => {
    const currentRequest = ++recommendationRequest;
    recommendations.value = [];
    recommendationError.value = "";

    if (!currentAccount?.onboardingComplete) {
      isLoadingRecommendations.value = false;
      return;
    }

    isLoadingRecommendations.value = true;

    try {
      const results =
        currentAccount.role === "tutor"
          ? await loadAssignmentRecommendations(currentAccount.id)
          : recommendTutors(await fetchTutors(), currentAccount);

      if (currentRequest === recommendationRequest) {
        recommendations.value = results;
      }
    } catch (error) {
      if (currentRequest !== recommendationRequest) return;
      console.error("Could not load recommendations:", error);
      recommendationError.value =
        "We could not load your recommendations. Please refresh and try again.";
    } finally {
      if (currentRequest === recommendationRequest) {
        isLoadingRecommendations.value = false;
      }
    }
  },
  { immediate: true },
);

async function loadAssignmentRecommendations(tutorId) {
  const [tutorProfile, assignments] = await Promise.all([
    fetchTutor(tutorId),
    fetchAssignments(),
  ]);

  return recommendAssignments(assignments, tutorProfile);
}

// FR-020: Load tutors the student has already requested
async function loadAppliedTutors() {
  const currentCheck = ++applicationCheckId;

  appliedTutorIds.value = [];
  applicationStatusError.value = false;
  applicationError.value = "";

  if (
    !user.value ||
    account.value?.role !== "student" ||
    !account.value.onboardingComplete
  ) {
    isCheckingApplications.value = false;
    return;
  }

  isCheckingApplications.value = true;

  try {
    const sentRequests = await fetchSentRequests();

    if (currentCheck !== applicationCheckId) return;

    appliedTutorIds.value = sentRequests
      .filter(
        (match) =>
          match.senderId === user.value.uid &&
          match.studentId === user.value.uid &&
          !match.assignmentId
      )
      .map((match) => match.tutorId);

  } catch (error) {
    if (currentCheck !== applicationCheckId) return;

    console.error("Could not load application statuses:", error);

    applicationStatusError.value = true;
    applicationError.value =
      "Could not check application statuses. Please refresh and try again.";

  } finally {
    if (currentCheck === applicationCheckId) {
      isCheckingApplications.value = false;
    }
  }
}

watch(
  [user, account],
  async () => {
    await loadAppliedTutors();
  },
  { immediate: true }
);

// FR-020: Apply to a recommended tutor
async function handleApply(tutor) {
  if (
    !user.value ||
    !account.value ||
    account.value.role !== "student" ||
    !account.value.onboardingComplete ||
    isCheckingApplications.value ||
    applicationStatusError.value ||
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

    if (!appliedTutorIds.value.includes(tutor.id)) {
      appliedTutorIds.value.push(tutor.id);
    }

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

function openTutorProfile(tutorId) {
  router.push({ name: "tutor-profile", params: { id: tutorId } });
}

function openFindAssignments() {
  router.push({ name: "find-assignments" });
}

function openRecommendation(event, item) {
  if (event.target.closest("button, a")) return;

  if (isTutor.value) {
    openFindAssignments();
  } else {
    openTutorProfile(item.id);
  }
}
</script>

<template>
  <div class="home-page">
    <div class="page-shell">
      <AppNavBar :account="account" />

      <p v-if="isLoading" class="state-message" role="status">Loading...</p>

      <p v-else-if="!user" class="state-message">
        Please sign in to continue.
        <RouterLink to="/register">Create an account</RouterLink>
      </p>

      <p v-else-if="errorMessage" class="state-message error" role="alert">
        {{ errorMessage }}
      </p>

      <p v-else-if="needsProfile" class="state-message" role="status">
        Taking you to profile setup...
      </p>

      <main v-else-if="account" class="home-content">
        <section class="hero" aria-labelledby="home-greeting">
          <div>
            <h1 id="home-greeting">
              {{ greeting }},<br />
              <span class="hero-name">{{ account.firstName }}!</span>
              <span aria-hidden="true"> 👋</span>
            </h1>
            <p class="hero-subtitle">{{ subtitle }}</p>
          </div>
          <p class="hero-tagline" aria-hidden="true">
            Learn<br />Grow<br />Succeed<br />Together
          </p>
        </section>

        <section class="features" aria-label="Why TutorLah">
          <article v-for="feature in FEATURES" :key="feature.title" class="feature">
            <span class="feature-icon" aria-hidden="true">
              <svg v-if="feature.icon === 'match'" viewBox="0 0 24 24">
                <circle cx="9" cy="8" r="3.5" />
                <circle cx="16.5" cy="9" r="2.8" />
                <path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5" />
                <path d="M15.5 14.6c2.9-.2 5.2 1.5 6 4.9" />
              </svg>
              <svg v-else-if="feature.icon === 'shield'" viewBox="0 0 24 24">
                <path d="M12 2.8 19.5 6v5.5c0 4.8-3.1 8.4-7.5 9.7-4.4-1.3-7.5-4.9-7.5-9.7V6L12 2.8Z" />
                <path d="m8.6 12 2.4 2.4 4.6-4.8" />
              </svg>
              <svg v-else-if="feature.icon === 'calendar'" viewBox="0 0 24 24">
                <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
                <path d="M3.5 9.5h17M8 3v4M16 3v4M8 13.5h2M14 13.5h2M8 17h2M14 17h2" />
              </svg>
              <svg v-else viewBox="0 0 24 24">
                <circle cx="8" cy="8" r="3" />
                <circle cx="16" cy="8" r="3" />
                <path d="M2.5 19c.5-3.2 2.6-5 5.5-5 1.6 0 2.9.5 3.9 1.5M21.5 19c-.5-3.2-2.6-5-5.5-5-1.6 0-2.9.5-3.9 1.5" />
              </svg>
            </span>
            <h2>{{ feature.title }}</h2>
            <p>{{ feature.text }}</p>
          </article>
        </section>

        <section class="recommended" aria-labelledby="recommended-title">
          <div class="section-heading">
            <h2 id="recommended-title">{{ recommendation.title }}</h2>
            <RouterLink v-if="canSeeAll" :to="recommendation.seeAllPath" class="see-all">
              See All
            </RouterLink>
          </div>
          <p
            v-if="applicationSuccess && !isTutor"
            class="recommendations-status"
            role="status"
          >
            {{ applicationSuccess }}
          </p>

          <p
            v-if="applicationError && !isTutor"
            class="recommendations-status error"
            role="alert"
          >
            {{ applicationError }}
          </p>

          <p
            v-if="isLoadingRecommendations"
            class="recommendations-status"
            role="status"
          >
            Loading recommendations...
          </p>

          <p
            v-else-if="recommendationError"
            class="recommendations-status error"
            role="alert"
          >
            {{ recommendationError }}
          </p>

          <div v-else-if="recommendations.length === 0" class="empty-state">
            <p class="empty-title">No recommendations yet</p>
            <p>{{ recommendation.emptyText }}</p>
          </div>

          <div v-else-if="isTutor" class="recommendation-list">
            <div
              v-for="{ item, compatibility } in recommendations"
              :key="item.id"
              class="recommendation"
              role="link"
              tabindex="0"
              :aria-label="`${item.level} ${item.subject}: open Find Assignments`"
              @click="openRecommendation($event, item)"
              @keydown.enter.self="openFindAssignments"
            >
              <AssignmentCard :assignment="item" :compatibility="compatibility" />
            </div>
          </div>

          <div v-else class="recommendation-list">
            <div
              v-for="{ item, compatibility } in recommendations"
              :key="item.id"
              class="recommendation"
              @click="openRecommendation($event, item)"
            >
              <TutorCard
                :tutor="item"
                :compatibility="compatibility"
                :applied="appliedTutorIds.includes(item.id)"
                :is-applying="applyingTutorIds.includes(item.id)"
                :disabled="
                  isCheckingApplications ||
                  applicationStatusError ||
                  account?.role !== 'student'
                "
                @view-profile="openTutorProfile"
                @apply="handleApply"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  padding: 24px;
  background: var(--page-background);
  color: var(--color-text, #1f2a30);
  font-family: var(--font-sans, Arial, Helvetica, sans-serif);
}
.home-page *,
.home-page *::before,
.home-page *::after {
  box-sizing: border-box;
}
.page-shell {
  max-width: 1120px;
  margin: 0 auto;
}
.state-message {
  padding: 32px 8px;
  color: var(--color-text-muted, #5b6770);
}
.state-message a {
  color: var(--color-primary, #0f6b4f);
  font-weight: 600;
}
.error {
  color: var(--color-error, #c0392b);
}
.home-content {
  display: grid;
  gap: 28px;
  padding: 36px 8px 48px;
}

.hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}
h1 {
  margin: 0;
  font-size: 38px;
  line-height: 1.15;
  letter-spacing: -1px;
  font-weight: 600;
}
.hero-name {
  font-weight: 800;
}
.hero-subtitle {
  margin: 12px 0 0;
  color: var(--color-text-muted, #5b6770);
  font-size: 17px;
}
.hero-tagline {
  margin: 0;
  color: var(--color-primary, #0f6b4f);
  font-family: "Bradley Hand", "Segoe Print", cursive;
  font-size: 19px;
  line-height: 1.25;
  text-align: right;
  transform: rotate(-6deg);
}

.features {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e3e7eb);
  border-radius: var(--radius-card, 14px);
  box-shadow: var(--shadow-card, 0 1px 3px rgba(16, 24, 40, 0.06));
}
.feature {
  padding: 22px 16px;
  text-align: center;
}
.feature + .feature {
  border-left: 1px solid var(--color-border, #e3e7eb);
}
.feature-icon {
  display: inline-grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--color-primary-light, #e7f4ee);
  color: var(--color-primary, #0f6b4f);
}
.feature-icon svg {
  width: 26px;
  height: 26px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.feature h2 {
  margin: 12px 0 4px;
  font-size: 15px;
}
.feature p {
  margin: 0;
  color: var(--color-text-muted, #5b6770);
  font-size: 13px;
  line-height: 1.4;
}

.section-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}
.section-heading h2 {
  margin: 0;
  font-size: 22px;
  letter-spacing: -0.4px;
}
.see-all {
  color: var(--color-primary, #0f6b4f);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
}
.see-all:hover {
  text-decoration: underline;
}

.recommended {
  display: flex;
  flex-direction: column;
}

.recommendations-status {
  margin: 0;
  padding: 24px 8px;
  color: var(--color-text-muted, #5b6770);
}
.recommendation-list {
  display: grid;
  gap: 16px;
}
.recommendation {
  border-radius: var(--radius-card, 14px);
  cursor: pointer;
  transition: transform 0.15s ease;
}
.recommendation:hover {
  transform: translateY(-2px);
}
.recommendation:focus-visible {
  outline: 3px solid var(--color-primary, #0f6b4f);
  outline-offset: 3px;
}
.empty-state {
  padding: 36px 24px;
  text-align: center;
  background: var(--color-surface, #fff);
  border: 1px dashed #c9d8d2;
  border-radius: var(--radius-card, 14px);
  color: var(--color-text-muted, #5b6770);
}
.empty-state p {
  margin: 0;
  font-size: 14px;
}
.empty-state .empty-title {
  margin-bottom: 6px;
  color: var(--color-text, #1f2a30);
  font-size: 16px;
  font-weight: 600;
}
a:focus-visible {
  outline: 3px solid var(--color-primary, #0f6b4f);
  outline-offset: 3px;
}

@media (max-width: 800px) {
  .features {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .feature:nth-child(3) {
    border-left: 0;
  }
  .feature:nth-child(n + 3) {
    border-top: 1px solid var(--color-border, #e3e7eb);
  }
}
@media (max-width: 560px) {
  .home-page {
    padding: 12px;
  }
  .home-content {
    padding: 24px 0 32px;
  }
  h1 {
    font-size: 30px;
  }
  .hero-tagline {
    display: none;
  }
}
</style>
