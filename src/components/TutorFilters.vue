<script setup>
import {
  SUBJECTS,
  LEVELS,
  LOCATIONS,
  AVAILABILITY,
  TEACHING_STYLES,
  createEmptyFilters,
} from "../constants/tutorFilters.js";

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

function updateFilter(key, value) {
  emit("update:modelValue", {
    ...props.modelValue,
    [key]: value,
  });
}

function updateBudget(value) {
  updateFilter(
    "maxBudget",
    value === "" ? null : Number(value)
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
      <label for="filter-level">Academic level</label>
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
      <label for="filter-budget">Max budget (SGD/hr)</label>
      <input
        id="filter-budget"
        type="number"
        min="0"
        placeholder="Any budget"
        :value="modelValue.maxBudget ?? ''"
        @input="updateBudget($event.target.value)"
      />
    </div>

    <div class="form-field">
      <label for="filter-availability">Availability</label>
      <select
        id="filter-availability"
        :value="modelValue.availability"
        @change="updateFilter('availability', $event.target.value)"
      >
        <option value="">Any time</option>
        <option v-for="slot in AVAILABILITY" :key="slot" :value="slot">
          {{ slot }}
        </option>
      </select>
    </div>

    <div class="form-field">
      <label for="filter-style">Teaching style</label>
      <select
        id="filter-style"
        :value="modelValue.teachingStyle"
        @change="updateFilter('teachingStyle', $event.target.value)"
      >
        <option value="">Any style</option>
        <option v-for="style in TEACHING_STYLES" :key="style" :value="style">
          {{ style }}
        </option>
      </select>
    </div>
  </aside>
</template>

<style scoped>
.filters {
  display: grid;
  gap: 16px;
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
  gap: 6px;
}

input,
select {
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
  font: inherit;
}

.clear-button {
  padding: 6px 10px;
  font: inherit;
  cursor: pointer;
}
</style>
