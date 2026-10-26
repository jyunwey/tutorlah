<script setup>
import {
  onMounted,
  ref,
} from 'vue'

import AssignmentCard from '../components/AssignmentCard.vue'
import {
  fetchAssignments,
} from '../services/assignments.js'

const assignments = ref([])
const isLoading = ref(true)
const errorMessage = ref('')

async function loadAssignments() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    assignments.value = await fetchAssignments()
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
          {{ assignments.length }}
          {{
            assignments.length === 1
              ? 'assignment'
              : 'assignments'
          }}
          found
        </p>

        <div
          v-if="assignments.length === 0"
          class="page-message"
        >
          <h2>No assignments available</h2>

          <p>
            New tuition assignments will appear here.
          </p>
        </div>

        <div
          v-else
          class="assignment-list"
        >
          <AssignmentCard
            v-for="assignment in assignments"
            :key="assignment.id"
            :assignment="assignment"
          />
        </div>
      </template>
    </section>
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
.results {
  width: 100%;
  max-width: 1000px;
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

.error-message button {
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

.error-message button:hover {
  background: var(--color-primary-dark);
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