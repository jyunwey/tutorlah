<script setup>
import { computed } from "vue";

import {
  SUBJECTS,
  LEVELS,
  LOCATIONS,
  AVAILABILITY,
  TEACHING_STYLES,
  BUDGET_MIN,
  BUDGET_MAX,
  createEmptyFilters,
} from "../constants/tutorFilters.js";

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

const budgetLabel = computed(() =>
  props.modelValue.maxBudget === null
    ? "Any"
    : `Up to $${props.modelValue.maxBudget}`
);

function updateFilter(key, value) {
  emit("update:modelValue", {
    ...props.modelValue,
    [key]: value,
  });
}

// Moving the slider to the far right removes the budget filter.
function updateBudget(value) {
  const amount = Number(value);

  updateFilter(
    "maxBudget",
    amount >= BUDGET_MAX ? null : amount
  );
}

// Adds the option if it isn't checked yet, otherwise removes it.
function toggleOption(key, option) {
  const selected = props.modelValue[key];

  updateFilter(
    key,
    selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option]
  );
}

function clearAll() {
  emit("update:modelValue", createEmptyFilters());
}
</script>

<template>
  <aside class="filters">
    <div class="filters-header">
      <h2>Filters</h2>

      <button type="button" class="clear-button" @click="clearAll">
        Clear All
      </button>
    </div>

    <div class="form-field">
      <label for="filter-subject">Subject</label>
      <select
        id="filter-subject"
        :value="modelValue.subject"
        @change="updateFilter('subject', $event.target.value)"
      >
        <option value="">Any subject</option>
        <option v-for="subject in SUBJECTS" :key="subject" :value="subject">
          {{ subject }}
        </option>
      </select>
    </div>

    <div class="form-field">
      <label for="filter-level">Academic Level</label>
      <select
        id="filter-level"
        :value="modelValue.level"
        @change="updateFilter('level', $event.target.value)"
      >
        <option value="">Any level</option>
        <option v-for="level in LEVELS" :key="level" :value="level">
          {{ level }}
        </option>
      </select>
    </div>

    <div class="form-field">
      <label for="filter-location">Location</label>
      <select
        id="filter-location"
        :value="modelValue.location"
        @change="updateFilter('location', $event.target.value)"
      >
        <option value="">Any location</option>
        <option v-for="location in LOCATIONS" :key="location" :value="location">
          {{ location }}
        </option>
      </select>
    </div>

    <div class="form-field">
      <div class="budget-header">
        <label for="filter-budget">Budget (per hour)</label>
        <span>{{ budgetLabel }}</span>
      </div>

      <input
        id="filter-budget"
        type="range"
        :min="BUDGET_MIN"
        :max="BUDGET_MAX"
        step="5"
        :value="modelValue.maxBudget ?? BUDGET_MAX"
        @input="updateBudget($event.target.value)"
      />

      <div class="range-labels">
        <span>${{ BUDGET_MIN }}</span>
        <span>${{ BUDGET_MAX }}</span>
      </div>
    </div>

    <fieldset class="form-field">
      <legend>Availability</legend>

      <label v-for="slot in AVAILABILITY" :key="slot" class="checkbox">
        <input
          type="checkbox"
          :checked="modelValue.availability.includes(slot)"
          @change="toggleOption('availability', slot)"
        />
        {{ slot }}
      </label>
    </fieldset>

    <fieldset class="form-field">
      <legend>Teaching Style</legend>

      <label v-for="style in TEACHING_STYLES" :key="style" class="checkbox">
        <input
          type="checkbox"
          :checked="modelValue.teachingStyles.includes(style)"
          @change="toggleOption('teachingStyles', style)"
        />
        {{ style }}
      </label>
    </fieldset>
  </aside>
</template>

<style scoped>
.filters {
  display: grid;
  gap: 20px;
  align-content: start;
  padding: 20px;
  background: white;
  border-radius: 12px;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters-header h2 {
  margin: 0;
  font-size: 1.1rem;
}

.form-field {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  border: none;
}

.form-field > label,
.budget-header label,
legend {
  font-weight: 600;
}

legend {
  margin-bottom: 8px;
  padding: 0;
}

select {
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
  font: inherit;
}

.budget-header,
.range-labels {
  display: flex;
  justify-content: space-between;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.clear-button {
  padding: 6px 10px;
  font: inherit;
  cursor: pointer;
}
</style>
