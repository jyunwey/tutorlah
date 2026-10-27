<script setup>
import {
  computed,
  onMounted,
  ref,
} from 'vue'

import AssignmentCard from '../components/AssignmentCard.vue'
import AssignmentFilters from '../components/AssignmentFilters.vue'
import {
  createEmptyAssignmentFilters,
} from '../constants/assignmentFilters.js'
import {
  fetchAssignments,
} from '../services/assignments.js'

const assignments = ref([])
const filters = ref(
  createEmptyAssignmentFilters()
)

const isLoading = ref(true)
const errorMessage = ref('')

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

onMounted(loadAssignments)
</script>

<template>
  <main class="find-assignments-page">
    <header class="page-header">
      <h1>Find Assignments</h1>

      <p>
        Browse tuition requests posted by students and parents.
      </p>
    </header>

    <div class="layout">
      <AssignmentFilters
        v-model="filters"
      />

      <section class="results">
        <p
          v-if="isLoading"
          class="page-message"
        >
          Loading assignments...
        </p>

        <div
          v-else-if="errorMessage"
          class="page-message error-message"
        >
          <p>
            {{ errorMessage }}
          </p>

          <button
            type="button"
            @click="loadAssignments"
          >
            Try Again
          </button>
        </div>

        <template v-else>
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
              v-for="
                assignment
                in filteredAssignments
              "
              :key="assignment.id"
              :assignment="assignment"
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
  padding: 40px 20px;
  box-sizing: border-box;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
}

.page-header,
.layout {
  width: 100%;
  max-width: 1200px;
  margin-right: auto;
  margin-left: auto;
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
}

.page-header p {
  margin-top: 8px;
  color: var(--color-text-muted);
  font-size: 1.1rem;
}

.layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  align-items: start;
  gap: 24px;
}

.results {
  display: grid;
  gap: 16px;
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

@media (max-width: 850px) {
  .layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .find-assignments-page {
    padding: 28px 16px;
  }

  .page-header h1 {
    font-size: 2rem;
  }
}
</style>