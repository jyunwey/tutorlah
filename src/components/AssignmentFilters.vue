<script setup>
import {
  computed,
} from 'vue'

import {
  BUDGET_MAX,
  BUDGET_MIN,
  LEARNING_MODES,
  LEVELS,
  LOCATIONS,
  POSTING_PERIODS,
  PREFERRED_DAYS,
  SUBJECTS,
  TIME_SLOTS,
  createEmptyAssignmentFilters,
} from '../constants/assignmentFilters.js'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits([
  'update:modelValue',
])

const budgetLabel = computed(() => {
  if (props.modelValue.minimumBudget === null) {
    return 'Any budget'
  }

  return `$${props.modelValue.minimumBudget}/hour or more`
})

function updateFilter(filterName, value) {
  emit('update:modelValue', {
    ...props.modelValue,
    [filterName]: value,
  })
}

function toggleLearningMode(mode) {
  const selectedModes =
    props.modelValue.learningModes

  const updatedModes =
    selectedModes.includes(mode)
      ? selectedModes.filter(
          (selectedMode) => selectedMode !== mode
        )
      : [...selectedModes, mode]

  updateFilter(
    'learningModes',
    updatedModes
  )
}

function updateBudget(value) {
  const amount = Number(value)

  updateFilter(
    'minimumBudget',
    amount <= BUDGET_MIN
      ? null
      : amount
  )
}

function clearAll() {
  emit(
    'update:modelValue',
    createEmptyAssignmentFilters()
  )
}
</script>

<template>
  <aside class="filters">
    <div class="filters-header">
      <h2>Filters</h2>

      <button
        type="button"
        class="clear-button"
        @click="clearAll"
      >
        Clear All
      </button>
    </div>

    <div class="filter-field">
      <label for="assignment-subject">
        Subject
      </label>

      <select
        id="assignment-subject"
        :value="modelValue.subject"
        @change="
          updateFilter(
            'subject',
            $event.target.value
          )
        "
      >
        <option value="">
          Any subject
        </option>

        <option
          v-for="subject in SUBJECTS"
          :key="subject"
          :value="subject"
        >
          {{ subject }}
        </option>
      </select>
    </div>

    <div class="filter-field">
      <label for="assignment-level">
        Academic Level
      </label>

      <select
        id="assignment-level"
        :value="modelValue.level"
        @change="
          updateFilter(
            'level',
            $event.target.value
          )
        "
      >
        <option value="">
          Any level
        </option>

        <option
          v-for="level in LEVELS"
          :key="level.value"
          :value="level.value"
        >
          {{ level.label }}
        </option>
      </select>
    </div>

    <div class="filter-field">
      <label for="assignment-location">
        Location
      </label>

      <select
        id="assignment-location"
        :value="modelValue.location"
        @change="
          updateFilter(
            'location',
            $event.target.value
          )
        "
      >
        <option value="">
          Any location
        </option>

        <option
          v-for="location in LOCATIONS"
          :key="location"
          :value="location"
        >
          {{ location }}
        </option>
      </select>
    </div>

    <fieldset class="filter-field">
      <legend>
        Learning Mode
      </legend>

      <label
        v-for="mode in LEARNING_MODES"
        :key="mode"
        class="checkbox"
      >
        <input
          type="checkbox"
          :checked="
            modelValue.learningModes.includes(mode)
          "
          @change="toggleLearningMode(mode)"
        />

        {{ mode }}
      </label>
    </fieldset>

    <div class="filter-field">
      <div class="budget-header">
        <label for="assignment-budget">
          Minimum Budget
        </label>

        <span>
          {{ budgetLabel }}
        </span>
      </div>

      <input
        id="assignment-budget"
        type="range"
        :min="BUDGET_MIN"
        :max="BUDGET_MAX"
        step="5"
        :value="
          modelValue.minimumBudget
            ?? BUDGET_MIN
        "
        @input="
          updateBudget(
            $event.target.value
          )
        "
      />

      <div class="range-labels">
        <span>
          Any
        </span>

        <span>
          ${{ BUDGET_MAX }}+
        </span>
      </div>
    </div>

    <div class="filter-field">
      <label for="assignment-day">
        Preferred Day
      </label>

      <select
        id="assignment-day"
        :value="modelValue.preferredDay"
        @change="
          updateFilter(
            'preferredDay',
            $event.target.value
          )
        "
      >
        <option value="">
          Any day
        </option>

        <option
          v-for="day in PREFERRED_DAYS"
          :key="day"
          :value="day"
        >
          {{ day }}
        </option>
      </select>
    </div>

    <div class="filter-field">
      <label for="assignment-time">
        Preferred Time
      </label>

      <select
        id="assignment-time"
        :value="modelValue.preferredTimeSlot"
        @change="
          updateFilter(
            'preferredTimeSlot',
            $event.target.value
          )
        "
      >
        <option value="">
          Any time slot
        </option>

        <option
          v-for="timeSlot in TIME_SLOTS"
          :key="timeSlot.value"
          :value="timeSlot.value"
        >
          {{ timeSlot.label }}
        </option>
      </select>
    </div>

    <div class="filter-field">
      <label for="assignment-posting-date">
        Posting Date
      </label>

      <select
        id="assignment-posting-date"
        :value="modelValue.postedWithinDays"
        @change="
          updateFilter(
            'postedWithinDays',
            $event.target.value
          )
        "
      >
        <option
          v-for="period in POSTING_PERIODS"
          :key="period.value"
          :value="period.value"
        >
          {{ period.label }}
        </option>
      </select>
    </div>
  </aside>
</template>

<style scoped>
.filters {
  display: grid;
  gap: 24px;
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.filters-header h2 {
  margin: 0;
  font-size: 1.2rem;
}

.clear-button {
  padding: 0;
  border: none;
  background: none;
  color: var(--color-primary);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.clear-button:hover {
  text-decoration: underline;
}

.filter-field {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  border: none;
}

.filter-field > label,
.filter-field legend,
.budget-header label {
  font-weight: 600;
}

.filter-field legend {
  margin-bottom: 10px;
  padding: 0;
}

select {
  width: 100%;
  padding: 11px 12px;
  box-sizing: border-box;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
}

select:focus-visible,
input:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-text);
  cursor: pointer;
}

.checkbox input {
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: var(--color-primary);
}

.budget-header,
.range-labels {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.budget-header span {
  color: var(--color-primary);
  font-size: 0.9rem;
  font-weight: 600;
}

input[type='range'] {
  width: 100%;
  margin: 0;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.range-labels {
  color: var(--color-text-muted);
  font-size: 0.85rem;
}
</style>