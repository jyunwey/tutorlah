<script setup>
import {
  computed,
  nextTick,
  onMounted,
  ref,
  watch,
} from 'vue'
import {
  RouterLink,
  useRoute,
} from 'vue-router'

import AppNavBar from '../components/AppNavBar.vue'
import AssignmentCard from '../components/AssignmentCard.vue'
import AssignmentFilters from '../components/AssignmentFilters.vue'
import {
  useCurrentAccount,
} from '../composables/useCurrentAccount.js'
import {
  createEmptyAssignmentFilters,
} from '../constants/assignmentFilters.js'
import {
  fetchAssignments,
} from '../services/assignments.js'
import {
  fetchTutor,
} from '../services/tutors.js'
import {
  getAssignmentCompatibility,
} from '../utils/compatibility.js'
import {
  fetchSentRequests,
  requestAssignment,
} from '../services/matches.js'

const {
  user,
  account,
  isLoading: isAccountLoading,
  errorMessage: accountErrorMessage,
} = useCurrentAccount()

const assignments = ref([])
const tutorProfile = ref(null)

const filters = ref(
  createEmptyAssignmentFilters()
)

const isLoading = ref(true)
const isTutorProfileLoading = ref(false)
const errorMessage = ref('')
const tutorProfileMessage = ref('')
const showFilters = ref(false)

// FR-021: Tutor assignment applications
const appliedAssignmentIds = ref([])
// FR-022: assignments whose poster rejected my application
const rejectedAssignmentIds = ref([])
const applyingAssignmentIds = ref([])
const isCheckingApplications = ref(false)
const applicationStatusError = ref(false)
const applicationError = ref('')
const applicationSuccess = ref('')

let profileRequestId = 0

const activeFilterCount = computed(() => {
  const {
    subject,
    level,
    location,
    learningModes,
    minimumBudget,
    preferredDay,
    preferredTimeSlot,
    postedWithinDays,
  } = filters.value

  return (
    [
      subject,
      level,
      location,
      preferredDay,
      preferredTimeSlot,
      postedWithinDays,
    ].filter(Boolean).length
    + learningModes.length
    + (
      minimumBudget === null
        ? 0
        : 1
    )
  )
})

const filteredAssignments = computed(() =>
  assignments.value.filter(
    (assignment) =>
      matchesFilters(
        assignment,
        filters.value
      )
  )
)

const rankedAssignments = computed(() =>
  filteredAssignments.value
    .map((assignment) => ({
      assignment,

      compatibility:
        getAssignmentCompatibility(
          tutorProfile.value,
          assignment
        ),
    }))
    .sort(
      (firstResult, secondResult) =>
        (
          secondResult.compatibility
          ?? -1
        )
        -
        (
          firstResult.compatibility
          ?? -1
        )
    )
)

const isPageLoading = computed(() =>
  isLoading.value
  || isAccountLoading.value
  || isTutorProfileLoading.value
)

// FR-007: an assignment opened from a Home recommendation
// (?assignment=<id>) is scrolled into view and highlighted, once the
// list has finished loading and sorting.
const route = useRoute()
const highlightedId = ref(
  typeof route.query.assignment === 'string'
    ? route.query.assignment
    : ''
)
let hasScrolledToHighlight = false

watch(
  isPageLoading,
  async (loading) => {
    if (loading || !highlightedId.value || hasScrolledToHighlight) {
      return
    }

    hasScrolledToHighlight = true
    await nextTick()
    document
      .getElementById(`assignment-${highlightedId.value}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  },
  { immediate: true }
)

const pageErrorMessage = computed(() =>
  errorMessage.value
  || accountErrorMessage.value
)

watch(
  account,
  async (currentAccount) => {
    const currentRequest =
      ++profileRequestId

    tutorProfile.value = null
    tutorProfileMessage.value = ''

    if (
      currentAccount?.role !== 'tutor'
      || !user.value
    ) {
      isTutorProfileLoading.value = false
      return
    }

    isTutorProfileLoading.value = true

    try {
      const profile = await fetchTutor(
        user.value.uid
      )

      if (currentRequest !== profileRequestId) {
        return
      }

      if (!profile) {
        tutorProfileMessage.value =
          'Complete your tutor profile to see compatibility scores.'

        return
      }

      tutorProfile.value = profile
    } catch (error) {
      if (currentRequest !== profileRequestId) {
        return
      }

      console.error(
        'Failed to load tutor profile:',
        error
      )

      tutorProfileMessage.value =
        'Compatibility scores could not be loaded.'
    } finally {
      if (currentRequest === profileRequestId) {
        isTutorProfileLoading.value = false
      }
    }
  },
  {
    immediate: true,
  }
)

function getCreatedAtMilliseconds(timestamp) {
  if (!timestamp) {
    return null
  }

  if (typeof timestamp.toMillis === 'function') {
    return timestamp.toMillis()
  }

  const milliseconds =
    new Date(timestamp).getTime()

  return Number.isNaN(milliseconds)
    ? null
    : milliseconds
}

function matchesFilters(
  assignment,
  activeFilters
) {
  const {
    subject,
    level,
    location,
    learningModes,
    minimumBudget,
    preferredDay,
    preferredTimeSlot,
    postedWithinDays,
  } = activeFilters

  if (
    subject
    && assignment.subject !== subject
  ) {
    return false
  }

  if (
    level
    && assignment.level !== level
  ) {
    return false
  }

  if (
    location
    && assignment.location !== location
  ) {
    return false
  }

  if (
    learningModes.length > 0
    && !learningModes.includes(
      assignment.learningMode
    )
  ) {
    return false
  }

  if (minimumBudget !== null) {
    const maximumRate =
      Number(assignment.maximumRate)

    if (
      !Number.isFinite(maximumRate)
      || maximumRate < minimumBudget
    ) {
      return false
    }
  }

  if (
    preferredDay
    && assignment.preferredDay
      !== preferredDay
  ) {
    return false
  }

  if (
    preferredTimeSlot
    && assignment.preferredTimeSlot
      !== preferredTimeSlot
  ) {
    return false
  }

  if (postedWithinDays) {
    const createdAt =
      getCreatedAtMilliseconds(
        assignment.createdAt
      )

    const maximumAge =
      Number(postedWithinDays)
      * 24
      * 60
      * 60
      * 1000

    const earliestAllowedTime =
      Date.now() - maximumAge

    if (
      createdAt === null
      || createdAt < earliestAllowedTime
    ) {
      return false
    }
  }

  return true
}

function clearFilters() {
  filters.value =
    createEmptyAssignmentFilters()
}

function reloadPage() {
  window.location.reload()
}

async function loadAssignments() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    assignments.value =
      await fetchAssignments()
  } catch (error) {
    console.error(
      'Failed to load assignments:',
      error
    )

    if (error.code === 'permission-denied') {
      errorMessage.value =
        'Please sign in to view assignments.'
    } else {
      errorMessage.value =
        'Could not load assignments. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
}

// FR-021: Load assignments the tutor has already applied for
async function loadAppliedAssignments() {
  if (!user.value || account.value?.role !== 'tutor') {
    appliedAssignmentIds.value = []
    rejectedAssignmentIds.value = []
    isCheckingApplications.value = false
    applicationStatusError.value = false
    return
  }

  isCheckingApplications.value = true
  applicationStatusError.value = false
  applicationError.value = ''

  try {
    const sentRequests = await fetchSentRequests()

    const myApplications = sentRequests.filter((match) =>
      match.senderId === user.value.uid &&
      match.tutorId === user.value.uid &&
      Boolean(match.assignmentId)
    )

    appliedAssignmentIds.value = myApplications.map((match) => match.assignmentId)
    rejectedAssignmentIds.value = myApplications
      .filter((match) => match.status === 'rejected')
      .map((match) => match.assignmentId)

  } catch (error) {
    console.error('Failed to load applications:', error)

    applicationStatusError.value = true
    applicationError.value =
      'Could not load application statuses. Please refresh and try again.'

  } finally {
    isCheckingApplications.value = false
  }
}

// FR-021: Tutor applies for an assignment
async function handleApply(assignment) {
  if (
    !user.value ||
    account.value?.role !== 'tutor' ||
    !account.value.onboardingComplete ||
    isCheckingApplications.value ||
    applicationStatusError.value ||
    appliedAssignmentIds.value.includes(assignment.id) ||
    applyingAssignmentIds.value.includes(assignment.id)
  ) {
    return
  }

  applicationError.value = ''
  applicationSuccess.value = ''
  applyingAssignmentIds.value.push(assignment.id)

  try {
    await requestAssignment(assignment, account.value)

    appliedAssignmentIds.value.push(assignment.id)
    applicationSuccess.value =
      `Your application for ${assignment.level} ${assignment.subject} has been sent!`

  } catch (error) {
    console.error('Failed to apply:', error)

    applicationError.value =
      'Could not send your application. Please try again.'

  } finally {
    applyingAssignmentIds.value =
      applyingAssignmentIds.value.filter(
        (id) => id !== assignment.id
      )
  }
}

watch(
  [user, account],
  async () => {
    await loadAppliedAssignments()
  },
  { immediate: true }
)

onMounted(loadAssignments)
</script>

<template>
  <main class="find-assignments-page">
    <div class="nav-wrapper">
      <AppNavBar :account="account" />
    </div>

    <header class="page-header">
      <h1>Find Assignments</h1>

      <p>
        Browse tuition requests posted by students and parents.
      </p>
    </header>

    <div class="layout">
      <button
        type="button"
        class="filters-toggle"
        aria-controls="assignment-filters"
        :aria-expanded="showFilters"
        @click="showFilters = !showFilters"
      >
        {{
          showFilters
            ? 'Hide Filters'
            : 'Show Filters'
        }}

        <span
          v-if="activeFilterCount > 0"
          class="filter-count"
        >
          {{ activeFilterCount }}
        </span>
      </button>

      <div
        id="assignment-filters"
        class="filters-wrapper"
        :class="{
          open: showFilters,
        }"
      >
        <AssignmentFilters
          v-model="filters"
        />
      </div>

      <section class="results">
        <!-- FR-021: Application feedback -->
        <p
          v-if="applicationSuccess"
          class="notice"
          role="status"
        >
          {{ applicationSuccess }}
        </p>

        <p
          v-if="applicationError"
          class="page-message error-message"
          role="alert"
        >
          {{ applicationError }}
        </p>

        <p
          v-if="isPageLoading"
          class="page-message"
        >
          Loading assignments...
        </p>

        <div
          v-else-if="!user"
          class="page-message"
        >

        <p>
          Please sign in to view assignments.
        </p>

        <RouterLink
          to="/login"
          class="message-link"
        >
          Sign In
        </RouterLink>
        </div>

        <div
          v-else-if="pageErrorMessage"
          class="page-message error-message"
        >
          <p>
            {{ pageErrorMessage }}
          </p>

          <button
            type="button"
            @click="reloadPage"
          >
            Try Again
          </button>
        </div>

        <template v-else>
          <div
            v-if="account?.role !== 'tutor'"
            class="notice"
          >
            Compatibility scores are available when signed in with a tutor account.
          </div>

          <div
            v-else-if="tutorProfileMessage"
            class="notice"
          >
            {{ tutorProfileMessage }}

            <RouterLink
              v-if="!tutorProfile"
              to="/create-profile"
            >
              Complete Profile
            </RouterLink>
          </div>

          <p
            class="result-count"
            aria-live="polite"
          >
            {{ filteredAssignments.length }}
            {{
              filteredAssignments.length === 1
                ? 'assignment'
                : 'assignments'
            }}
            found
          </p>

          <div
            v-if="assignments.length === 0"
            class="page-message"
          >
            <h2>
              No assignments available
            </h2>

            <p>
              New tuition assignments will appear here.
            </p>
          </div>

          <div
            v-else-if="
              filteredAssignments.length === 0
            "
            class="page-message"
          >
            <h2>
              No matching assignments
            </h2>

            <p>
              Try changing or removing some filters.
            </p>

            <button
              v-if="activeFilterCount > 0"
              type="button"
              class="clear-filters-button"
              @click="clearFilters"
            >
              Clear All Filters
            </button>
          </div>

          <div
            v-else
            class="assignment-list"
          >
            <AssignmentCard
              v-for="{
                assignment,
                compatibility,
              } in rankedAssignments"
              :id="`assignment-${assignment.id}`"
              :key="assignment.id"
              :class="{ highlighted: assignment.id === highlightedId }"
              :assignment="assignment"
              :compatibility="compatibility"
              :show-apply="account?.role === 'tutor'"
              :applied="appliedAssignmentIds.includes(assignment.id)"
              :rejected="rejectedAssignmentIds.includes(assignment.id)"
              :is-applying="applyingAssignmentIds.includes(assignment.id)"
              :disabled="
                isCheckingApplications ||
                applicationStatusError ||
                !account?.onboardingComplete ||
                assignment.status !== 'open'
              "
              @apply="handleApply"
            />
          </div>
        </template>
      </section>
    </div>
  </main>
</template>

<style scoped>
.find-assignments-page {
  min-height: 100vh;
  padding: 24px 20px 48px;
  box-sizing: border-box;
  background: var(--page-background);
  color: var(--color-text);
  font-family: var(--font-sans);
}

.nav-wrapper,
.page-header,
.layout {
  width: 100%;
  max-width: 1200px;
  margin-right: auto;
  margin-left: auto;
}

.nav-wrapper {
  margin-bottom: 32px;
}

.page-header {
  margin-bottom: 28px;
}

.page-header h1,
.page-header p {
  margin: 0;
}

.page-header h1 {
  font-size: 2.5rem;
  letter-spacing: -0.02em;
}

.page-header p {
  margin-top: 8px;
  color: var(--color-text-muted);
  font-size: 1.1rem;
}

.layout {
  display: grid;
  grid-template-columns:
    280px minmax(0, 1fr);
  align-items: start;
  gap: 24px;
}

.filters-wrapper {
  position: sticky;
  top: 16px;
}

.results {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.result-count {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.assignment-list {
  display: grid;
  gap: 16px;
}

/* FR-007: the assignment opened from a Home recommendation. */
.assignment-list .highlighted {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.notice {
  padding: 14px 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
}

.notice a {
  margin-left: 6px;
  color: inherit;
  font-weight: 700;
}

.page-message {
  margin: 0;
  padding: 48px 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  color: var(--color-text-muted);
  text-align: center;
}

.page-message h2,
.page-message p {
  margin: 0;
}

.page-message h2 {
  margin-bottom: 8px;
  color: var(--color-text);
  font-size: 1.2rem;
}

.message-link {
  display: inline-block;
  margin-top: 16px;
  color: var(--color-primary);
  font-weight: 700;
}

.error-message {
  color: var(--color-error);
}

.error-message button,
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

.error-message button:hover,
.clear-filters-button:hover {
  background: var(--color-primary-dark);
}

.filters-toggle {
  display: none;
}

.filter-count {
  display: inline-grid;
  place-items: center;
  min-width: 22px;
  height: 22px;
  margin-left: 8px;
  border-radius: 999px;
  background: white;
  color: var(--color-primary);
  font-size: 0.8rem;
}

@media (max-width: 850px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .filters-toggle {
    display: block;
    width: 100%;
    padding: 12px 18px;
    border: none;
    border-radius: var(--radius-control);
    background: var(--color-primary);
    color: white;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  .filters-wrapper {
    display: none;
    position: static;
  }

  .filters-wrapper.open {
    display: block;
  }
}

@media (max-width: 600px) {
  .find-assignments-page {
    padding: 16px 14px 36px;
  }

  .nav-wrapper {
    margin-bottom: 24px;
  }

  .page-header h1 {
    font-size: 2rem;
  }
}
</style>