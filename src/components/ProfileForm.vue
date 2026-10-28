<script setup>
import { computed, nextTick, reactive, ref } from "vue";
import {
  AVAILABILITY,
  BUDGET_MAX,
  BUDGET_MIN,
  LEVELS,
  LOCATIONS,
  SUBJECTS,
  TEACHING_STYLES,
} from "../constants/tutorFilters.js";
import { LESSON_MODES } from "../constants/profileOptions.js";

const props = defineProps({
  role: { type: String, required: true },
  initialValues: { type: Object, default: () => ({}) },
  submitLabel: { type: String, default: "Save" },
  isSaving: { type: Boolean, default: false },
  saveError: { type: String, default: "" },
  showCancel: { type: Boolean, default: false },
  showName: { type: Boolean, default: false },
});

const emit = defineEmits(["submit", "cancel"]);

const DEFAULTS = {
  firstName: "",
  lastName: "",
  phone: "",
  location: "",
  subjects: [],
  level: "",
  levels: [],
  lessonModes: [],
  availability: [],
  teachingStyles: [],
  budgetMin: BUDGET_MIN,
  budgetMax: BUDGET_MAX,
  hourlyRate: null,
  qualification: "",
  yearsOfExperience: null,
  bio: "",
};

function startingValues() {
  const values = {};
  for (const [key, fallback] of Object.entries(DEFAULTS)) {
    const value = props.initialValues[key];
    if (Array.isArray(fallback)) {
      values[key] = Array.isArray(value) ? [...value] : [];
    } else {
      values[key] = value ?? fallback;
    }
  }
  return values;
}

const form = reactive(startingValues());

const showErrors = ref(false);

const isTutor = computed(() => props.role === "tutor");

const PHONE_PATTERN = /^\+?[0-9 ]{8,15}$/;
const NAME_MAX_LENGTH = 50;
const RATE_MIN = 10;
const RATE_MAX = 300;

function isWholeNumber(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function toOptions(list) {
  return list.map((item) =>
    typeof item === "string" ? { value: item, label: item } : item,
  );
}

const LEVEL_OPTIONS = toOptions(LEVELS);

const choiceGroups = computed(() =>
  isTutor.value
    ? [
        { key: "subjects", label: "Subjects I Teach", options: toOptions(SUBJECTS), required: true },
        { key: "levels", label: "Levels I Teach", options: LEVEL_OPTIONS, required: true },
        { key: "lessonModes", label: "Teaching Mode", options: toOptions(LESSON_MODES), required: true },
        { key: "availability", label: "Availability", options: toOptions(AVAILABILITY), required: true },
        { key: "teachingStyles", label: "Teaching Style", options: toOptions(TEACHING_STYLES), required: true },
      ]
    : [
        { key: "subjects", label: "Preferred Subjects", options: toOptions(SUBJECTS), required: true },
        { key: "lessonModes", label: "Preferred Learning Mode", options: toOptions(LESSON_MODES), required: true },
        { key: "availability", label: "Availability", options: toOptions(AVAILABILITY), required: false },
        { key: "teachingStyles", label: "Preferred Teaching Style", options: toOptions(TEACHING_STYLES), required: false },
      ],
);

const errors = computed(() => {
  const found = {};
  if (props.showName) {
    if (!form.firstName.trim()) found.firstName = "Enter your first name.";
    if (!form.lastName.trim()) found.lastName = "Enter your last name.";
  }
  if (form.phone && !PHONE_PATTERN.test(form.phone)) {
    found.phone = "Enter a valid phone number, e.g. 9123 4567.";
  }
  if (!form.location) found.location = "Select your region.";

  if (isTutor.value) {
    if (!isWholeNumber(form.hourlyRate, RATE_MIN, RATE_MAX)) {
      found.hourlyRate = `Enter a whole number from ${RATE_MIN} to ${RATE_MAX}.`;
    }
    if (!isWholeNumber(form.yearsOfExperience, 0, 60)) {
      found.yearsOfExperience = "Enter a whole number of years from 0 to 60.";
    }
    if (!form.qualification) found.qualification = "Enter your academic background.";
  } else {
    if (!form.level) found.level = "Select an academic level.";
    if (
      !isWholeNumber(form.budgetMin, BUDGET_MIN, BUDGET_MAX) ||
      !isWholeNumber(form.budgetMax, BUDGET_MIN, BUDGET_MAX)
    ) {
      found.budget = `Enter amounts from ${BUDGET_MIN} to ${BUDGET_MAX}.`;
    } else if (form.budgetMin > form.budgetMax) {
      found.budget = "The minimum cannot be more than the maximum.";
    }
  }

  for (const group of choiceGroups.value) {
    if (group.required && form[group.key].length === 0) {
      found[group.key] = "Select at least one option.";
    }
  }
  return found;
});

function errorFor(key) {
  return showErrors.value ? errors.value[key] : "";
}

function buildPayload() {
  const shared = {
    ...(props.showName
      ? { firstName: form.firstName.trim(), lastName: form.lastName.trim() }
      : {}),
    phone: form.phone,
    location: form.location,
    subjects: [...form.subjects],
    lessonModes: [...form.lessonModes],
    availability: [...form.availability],
    teachingStyles: [...form.teachingStyles],
  };
  if (isTutor.value) {
    return {
      ...shared,
      levels: [...form.levels],
      hourlyRate: form.hourlyRate,
      qualification: form.qualification,
      yearsOfExperience: form.yearsOfExperience,
      bio: form.bio,
    };
  }
  return {
    ...shared,
    level: form.level,
    budgetMin: form.budgetMin,
    budgetMax: form.budgetMax,
  };
}

async function handleSubmit() {
  showErrors.value = true;
  const firstError = Object.keys(errors.value)[0];
  if (firstError) {
    await nextTick();
    document.getElementById(`field-${firstError}`)?.focus();
    return;
  }
  emit("submit", buildPayload());
}
</script>

<template>
  <form class="profile-form" novalidate @submit.prevent="handleSubmit">
    <section class="form-section" aria-labelledby="contact-heading">
      <h2 id="contact-heading">{{ showName ? "Name, Contact and Location" : "Contact and Location" }}</h2>
      <div class="field-grid">
        <template v-if="showName">
          <label class="field">
            <span>First Name <em class="required" aria-hidden="true">*</em></span>
            <input id="field-firstName" v-model="form.firstName" type="text" :maxlength="NAME_MAX_LENGTH" autocomplete="given-name" required :aria-invalid="Boolean(errorFor('firstName'))" />
            <small v-if="errorFor('firstName')" class="field-error">{{ errorFor("firstName") }}</small>
          </label>
          <label class="field">
            <span>Last Name <em class="required" aria-hidden="true">*</em></span>
            <input id="field-lastName" v-model="form.lastName" type="text" :maxlength="NAME_MAX_LENGTH" autocomplete="family-name" required :aria-invalid="Boolean(errorFor('lastName'))" />
            <small v-if="errorFor('lastName')" class="field-error">{{ errorFor("lastName") }}</small>
          </label>
        </template>
        <label class="field">
          <span>Contact Number</span>
          <input id="field-phone" v-model.trim="form.phone" type="tel" inputmode="tel" placeholder="e.g. 9123 4567" :aria-invalid="Boolean(errorFor('phone'))" />
          <small v-if="errorFor('phone')" class="field-error">{{ errorFor("phone") }}</small>
          <small v-else>Only you can see this.</small>
        </label>
        <label class="field">
          <span>Location <em class="required" aria-hidden="true">*</em></span>
          <select id="field-location" v-model="form.location" required :aria-invalid="Boolean(errorFor('location'))">
            <option value="" disabled>Select a region</option>
            <option v-for="option in LOCATIONS" :key="option" :value="option">{{ option }}</option>
          </select>
          <small v-if="errorFor('location')" class="field-error">{{ errorFor("location") }}</small>
        </label>
      </div>
    </section>

    <section class="form-section" aria-labelledby="details-heading">
      <h2 id="details-heading">{{ isTutor ? "Teaching Details" : "Learning Preferences" }}</h2>

      <div class="field-grid">
        <template v-if="isTutor">
          <label class="field">
            <span>Hourly Rate (SGD) <em class="required" aria-hidden="true">*</em></span>
            <input id="field-hourlyRate" v-model.number="form.hourlyRate" type="number" :min="RATE_MIN" :max="RATE_MAX" step="1" placeholder="e.g. 45" required :aria-invalid="Boolean(errorFor('hourlyRate'))" />
            <small v-if="errorFor('hourlyRate')" class="field-error">{{ errorFor("hourlyRate") }}</small>
          </label>
          <label class="field">
            <span>Teaching Experience (years) <em class="required" aria-hidden="true">*</em></span>
            <input id="field-yearsOfExperience" v-model.number="form.yearsOfExperience" type="number" min="0" max="60" step="1" placeholder="e.g. 3" required :aria-invalid="Boolean(errorFor('yearsOfExperience'))" />
            <small v-if="errorFor('yearsOfExperience')" class="field-error">{{ errorFor("yearsOfExperience") }}</small>
          </label>
          <label class="field wide">
            <span>Academic Background <em class="required" aria-hidden="true">*</em></span>
            <input id="field-qualification" v-model.trim="form.qualification" type="text" maxlength="60" placeholder="e.g. NUS Graduate, Ex-MOE Teacher" required :aria-invalid="Boolean(errorFor('qualification'))" />
            <small v-if="errorFor('qualification')" class="field-error">{{ errorFor("qualification") }}</small>
          </label>
        </template>

        <template v-else>
          <label class="field">
            <span>Academic Level <em class="required" aria-hidden="true">*</em></span>
            <select id="field-level" v-model="form.level" required :aria-invalid="Boolean(errorFor('level'))">
              <option value="" disabled>Select a level</option>
              <option v-for="option in LEVEL_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
            <small v-if="errorFor('level')" class="field-error">{{ errorFor("level") }}</small>
          </label>
          <fieldset class="field budget">
            <legend>Budget per hour (SGD) <em class="required" aria-hidden="true">*</em></legend>
            <div class="budget-inputs">
              <input id="field-budget" v-model.number="form.budgetMin" type="number" :min="BUDGET_MIN" :max="BUDGET_MAX" step="1" aria-label="Minimum budget" :aria-invalid="Boolean(errorFor('budget'))" />
              <span>to</span>
              <input v-model.number="form.budgetMax" type="number" :min="BUDGET_MIN" :max="BUDGET_MAX" step="1" aria-label="Maximum budget" :aria-invalid="Boolean(errorFor('budget'))" />
            </div>
            <small v-if="errorFor('budget')" class="field-error">{{ errorFor("budget") }}</small>
          </fieldset>
        </template>
      </div>

      <fieldset v-for="group in choiceGroups" :key="group.key" class="choice-group">
        <legend>
          {{ group.label }}
          <em v-if="group.required" class="required" aria-hidden="true">*</em>
          <span v-else class="optional">(optional)</span>
        </legend>
        <div class="chips">
          <label v-for="(option, index) in group.options" :key="option.value" class="chip" :class="{ selected: form[group.key].includes(option.value) }">
            <input :id="index === 0 ? `field-${group.key}` : undefined" v-model="form[group.key]" type="checkbox" :value="option.value" />
            {{ option.label }}
          </label>
        </div>
        <small v-if="errorFor(group.key)" class="field-error">{{ errorFor(group.key) }}</small>
      </fieldset>

      <label v-if="isTutor" class="field wide">
        <span>About Me</span>
        <textarea v-model.trim="form.bio" rows="4" maxlength="600" placeholder="Share your teaching approach and what students can expect."></textarea>
        <small>{{ form.bio.length }}/600</small>
      </label>
    </section>

    <div class="form-footer">
      <p v-if="saveError" class="save-error" role="alert">{{ saveError }}</p>
      <p v-else class="footnote"><em class="required" aria-hidden="true">*</em> Required</p>
      <div class="actions">
        <button v-if="showCancel" type="button" class="secondary-button" :disabled="isSaving" @click="$emit('cancel')">Cancel</button>
        <button type="submit" class="primary-button" :disabled="isSaving">{{ isSaving ? "Saving..." : submitLabel }}</button>
      </div>
    </div>
  </form>
</template>

<style scoped>
.profile-form, .profile-form *, .profile-form *::before, .profile-form *::after { box-sizing: border-box; }
.form-section { padding: 22px 0; border-top: 1px solid #e7eaf3; }
h2 { margin: 0 0 16px; font-size: 18px; letter-spacing: -.3px; }
.field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 24px; margin-bottom: 8px; }
.field { display: flex; flex-direction: column; gap: 7px; min-width: 0; margin: 0; padding: 0; border: 0; font-size: 14px; font-weight: 600; }
.field.wide { grid-column: 1 / -1; }
.field input, .field select, .field textarea { width: 100%; padding: 11px 12px; border: 1px solid #cfd6e4; border-radius: 6px; background: #fff; color: #11143d; font: inherit; font-weight: 400; }
.field textarea { resize: vertical; line-height: 1.5; }
.field input:focus, .field select:focus, .field textarea:focus { outline: none; border-color: #008563; box-shadow: 0 0 0 3px rgba(0, 133, 99, .15); }
.field small { color: #717887; font-size: 12px; font-weight: 400; }
.form-section > .field.wide { margin-top: 18px; }
.budget legend { margin-bottom: 7px; padding: 0; }
.budget-inputs { display: flex; align-items: center; gap: 10px; color: #616999; font-weight: 400; }
.budget-inputs input { min-width: 0; }
.choice-group { margin: 18px 0 0; padding: 0; border: 0; }
.choice-group legend { margin-bottom: 10px; padding: 0; font-size: 14px; font-weight: 600; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { display: inline-flex; align-items: center; padding: 8px 14px; border: 1px solid #cfd6e4; border-radius: 999px; background: #fff; color: #414b73; font-size: 13px; cursor: pointer; user-select: none; }
.chip input { position: absolute; opacity: 0; pointer-events: none; }
.chip.selected { border-color: #39ae86; background: #e6f7f0; color: #006c50; font-weight: 600; }
.chip:focus-within { outline: 3px solid rgba(0, 133, 99, .35); outline-offset: 2px; }
.field-error, .field small.field-error { display: block; color: #b42318; font-size: 12px; font-weight: 600; }
.choice-group .field-error { margin-top: 8px; }
.field [aria-invalid="true"] { border-color: #d92d20; }
.required { color: #c4320a; font-style: normal; }
.optional { color: #8a90a8; font-size: 12px; font-weight: 400; }
.form-footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-top: 22px; border-top: 1px solid #e7eaf3; }
.save-error { margin: 0; color: #b42318; font-size: 14px; font-weight: 600; }
.footnote { margin: 0; color: #717887; font-size: 13px; }
.actions { display: flex; gap: 12px; }
.primary-button { padding: 12px 22px; border: 0; border-radius: 6px; background: #008563; color: #fff; font: inherit; font-size: 15px; font-weight: 700; cursor: pointer; }
.primary-button:disabled { background: #9fcdbd; cursor: not-allowed; }
.secondary-button { padding: 12px 20px; border: 1px solid #39ae86; border-radius: 6px; background: #fff; color: #00805d; font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; }
.secondary-button:disabled { opacity: .6; cursor: not-allowed; }
@media (max-width: 700px) {
  .field-grid { grid-template-columns: 1fr; }
  .form-footer { flex-direction: column-reverse; align-items: stretch; }
  .actions { flex-direction: column-reverse; }
  .primary-button, .secondary-button { width: 100%; }
}
</style>
