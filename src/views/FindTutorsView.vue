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

// TODO (FR-010): return false when the tutor doesn't match
// the subject, level, location, budget, availability or
// teaching style filter.
// eslint-disable-next-line no-unused-vars
function matchesFilters(tutor, activeFilters) {
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
    <h1>Find Tutors</h1>

    <div class="layout">
      <!-- FR-010 -->
      <TutorFilters v-model="filters" />

      <!-- FR-008 -->
      <section class="results">
        <p v-if="isLoading">Loading tutors...</p>

        <p v-else-if="errorMessage" class="error">
          {{ errorMessage }}
        </p>

        <template v-else>
          <p class="result-count">
            {{ filteredTutors.length }}
            {{ filteredTutors.length === 1 ? "tutor" : "tutors" }} found
          </p>

          <p v-if="filteredTutors.length === 0" class="empty">
            No tutors found
          </p>

          <div v-else class="card-grid">
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
  padding: 32px 20px;
  box-sizing: border-box;
  background: #f5f5f5;
}

h1 {
  max-width: 1200px;
  margin: 0 auto 20px;
}

.layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.result-count {
  margin-top: 0;
  font-weight: 600;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.error {
  color: red;
}

@media (max-width: 720px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
