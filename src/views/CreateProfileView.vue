<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import { RouterLink } from "vue-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { observeCurrentUser } from "../services/auth.js";
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

const account = ref(null);
const isLoading = ref(true);
const isSignedIn = ref(false);
const errorMessage = ref("");
let unsubscribe;
let requestId = 0;

const form = reactive({
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
  experienceYears: null,
  bio: "",
});

const isTutor = computed(() => account.value?.role === "tutor");
const roleLabel = computed(() => (isTutor.value ? "Tutor" : "Student / Parent"));
const subtitle = computed(() =>
  isTutor.value
    ? "Tell students and parents what you teach so they can find you."
    : "Tell us what you are looking for so we can match you with the right tutor.",
);

const choiceGroups = computed(() =>
  isTutor.value
    ? [
        { key: "subjects", label: "Subjects I Teach", options: SUBJECTS, required: true },
        { key: "levels", label: "Levels I Teach", options: LEVELS, required: true },
        { key: "lessonModes", label: "Teaching Mode", options: LESSON_MODES, required: true },
        { key: "availability", label: "Availability", options: AVAILABILITY, required: true },
        { key: "teachingStyles", label: "Teaching Style", options: TEACHING_STYLES, required: true },
      ]
    : [
        { key: "subjects", label: "Preferred Subjects", options: SUBJECTS, required: true },
        { key: "lessonModes", label: "Preferred Learning Mode", options: LESSON_MODES, required: true },
        { key: "availability", label: "Availability", options: AVAILABILITY, required: false },
        { key: "teachingStyles", label: "Preferred Teaching Style", options: TEACHING_STYLES, required: false },
      ],
);

onMounted(() => {
  unsubscribe = observeCurrentUser(async (user) => {
    const currentRequest = ++requestId;
    account.value = null;
    errorMessage.value = "";
    isSignedIn.value = Boolean(user);
    isLoading.value = true;

    if (!user) {
      isLoading.value = false;
      return;
    }

    try {
      const snapshot = await getDoc(doc(db, "users", user.uid));
      if (currentRequest !== requestId) return;
      if (snapshot.exists()) {
        account.value = snapshot.data();
      } else {
        errorMessage.value = "Your account details could not be found.";
      }
    } catch (error) {
      if (currentRequest !== requestId) return;
      console.error("Could not load account:", error);
      errorMessage.value = "We could not load your account. Please refresh and try again.";
    } finally {
      if (currentRequest === requestId) isLoading.value = false;
    }
  });
});

onUnmounted(() => {
  requestId++;
  unsubscribe?.();
});
</script>

<template>
  <div class="setup-page">
    <div class="page-shell">
      <header class="site-header">
        <div class="brand" aria-label="TutorLah">
          <svg viewBox="0 0 40 36" aria-hidden="true">
            <path d="M2 12 20 3l18 9-18 9L2 12Z" fill="currentColor" />
            <path d="M9 18v9l11 6 11-6v-9l-11 6-11-6Z" fill="currentColor" />
            <path d="M4 15v11" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
            <circle cx="20" cy="11" r="2" fill="white" />
          </svg>
          <span>Tutor<span class="brand-green">Lah</span></span>
        </div>
      </header>

      <main class="setup-card" aria-labelledby="setup-title">
        <p v-if="isLoading" class="state-message" role="status">Loading...</p>

        <div v-else-if="!isSignedIn" class="state-message">
          <p>Please sign up or log in first.</p>
          <RouterLink to="/register" class="text-link">Go to Sign Up</RouterLink>
        </div>

        <p v-else-if="errorMessage" class="state-message error" role="alert">{{ errorMessage }}</p>

        <div v-else-if="account?.onboardingComplete" class="state-message">
          <p>Your profile is already set up.</p>
          <RouterLink to="/profile" class="text-link">Go to My Profile</RouterLink>
        </div>

        <template v-else-if="account">
          <div class="heading-row">
            <div>
              <h1 id="setup-title">Set Up Your Profile</h1>
              <p class="subtitle">Welcome, {{ account.firstName }}! {{ subtitle }}</p>
            </div>
            <span class="role-badge">{{ roleLabel }}</span>
          </div>

          <form class="setup-form" novalidate @submit.prevent>
            <section class="form-section" aria-labelledby="contact-heading">
              <h2 id="contact-heading">Contact and Location</h2>
              <div class="field-grid">
                <label class="field">
                  <span>Contact Number</span>
                  <input v-model.trim="form.phone" type="tel" inputmode="tel" placeholder="e.g. 9123 4567" />
                  <small>Only you can see this.</small>
                </label>
                <label class="field">
                  <span>Location <em class="required" aria-hidden="true">*</em></span>
                  <select v-model="form.location" required>
                    <option value="" disabled>Select a region</option>
                    <option v-for="option in LOCATIONS" :key="option" :value="option">{{ option }}</option>
                  </select>
                </label>
              </div>
            </section>

            <section class="form-section" aria-labelledby="details-heading">
              <h2 id="details-heading">{{ isTutor ? "Teaching Details" : "Learning Preferences" }}</h2>

              <div class="field-grid">
                <template v-if="isTutor">
                  <label class="field">
                    <span>Hourly Rate (SGD) <em class="required" aria-hidden="true">*</em></span>
                    <input v-model.number="form.hourlyRate" type="number" :min="BUDGET_MIN" :max="BUDGET_MAX" step="1" placeholder="e.g. 45" required />
                  </label>
                  <label class="field">
                    <span>Teaching Experience (years) <em class="required" aria-hidden="true">*</em></span>
                    <input v-model.number="form.experienceYears" type="number" min="0" max="50" step="1" placeholder="e.g. 3" required />
                  </label>
                  <label class="field wide">
                    <span>Academic Background <em class="required" aria-hidden="true">*</em></span>
                    <input v-model.trim="form.qualification" type="text" placeholder="e.g. BSc Mathematics, NUS" required />
                  </label>
                </template>

                <template v-else>
                  <label class="field">
                    <span>Academic Level <em class="required" aria-hidden="true">*</em></span>
                    <select v-model="form.level" required>
                      <option value="" disabled>Select a level</option>
                      <option v-for="option in LEVELS" :key="option" :value="option">{{ option }}</option>
                    </select>
                  </label>
                  <fieldset class="field budget">
                    <legend>Budget per hour (SGD) <em class="required" aria-hidden="true">*</em></legend>
                    <div class="budget-inputs">
                      <input v-model.number="form.budgetMin" type="number" :min="BUDGET_MIN" :max="BUDGET_MAX" step="1" aria-label="Minimum budget" />
                      <span>to</span>
                      <input v-model.number="form.budgetMax" type="number" :min="BUDGET_MIN" :max="BUDGET_MAX" step="1" aria-label="Maximum budget" />
                    </div>
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
                  <label v-for="option in group.options" :key="option" class="chip" :class="{ selected: form[group.key].includes(option) }">
                    <input v-model="form[group.key]" type="checkbox" :value="option" />
                    {{ option }}
                  </label>
                </div>
              </fieldset>

              <label v-if="isTutor" class="field wide">
                <span>About Me</span>
                <textarea v-model.trim="form.bio" rows="4" maxlength="600" placeholder="Share your teaching approach and what students can expect."></textarea>
                <small>{{ form.bio.length }}/600</small>
              </label>
            </section>

            <div class="form-footer">
              <p class="footnote"><em class="required" aria-hidden="true">*</em> Required</p>
              <button type="submit" class="primary-button" disabled>Save and Continue</button>
            </div>
          </form>
        </template>
      </main>
    </div>
  </div>
</template>

<style scoped>
.setup-page {
  min-height: 100vh;
  padding: 24px;
  box-sizing: border-box;
  background: linear-gradient(135deg, #f0fcf8, #f8fdfc 55%, #eafbf5);
  color: #11143d;
  font-family: Arial, Helvetica, sans-serif;
}
.setup-page *, .setup-page *::before, .setup-page *::after { box-sizing: border-box; }
.page-shell { max-width: 960px; margin: 0 auto; }
.site-header { display: flex; align-items: center; min-height: 72px; padding: 14px 24px; background: #fff; border: 1px solid #dceee8; border-radius: 9px; }
.brand { display: flex; align-items: center; gap: 8px; color: #101820; font-size: 25px; font-weight: 700; letter-spacing: -1px; }
.brand svg { width: 36px; height: 34px; color: #008563; }
.brand-green { color: #008563; }
.setup-card { margin-top: 20px; padding: 32px 32px 36px; background: rgba(255, 255, 255, .92); border: 1px solid #e1efeb; border-radius: 9px; }
.heading-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
h1 { margin: 0; font-size: 32px; line-height: 1.2; letter-spacing: -.9px; }
.subtitle { margin: 8px 0 0; color: #616999; font-size: 15px; line-height: 1.5; }
.role-badge { flex-shrink: 0; padding: 7px 14px; border-radius: 999px; background: #def5eb; color: #006c50; font-size: 13px; font-weight: 700; }
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
.required { color: #c4320a; font-style: normal; }
.optional { color: #8a90a8; font-size: 12px; font-weight: 400; }
.form-footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-top: 22px; border-top: 1px solid #e7eaf3; }
.footnote { margin: 0; color: #717887; font-size: 13px; }
.primary-button { padding: 12px 22px; border: 0; border-radius: 6px; background: #008563; color: #fff; font: inherit; font-size: 15px; font-weight: 700; cursor: pointer; }
.primary-button:disabled { background: #9fcdbd; cursor: not-allowed; }
.state-message { padding: 24px 0; color: #616999; }
.state-message p { margin: 0 0 12px; }
.text-link { color: #008563; font-weight: 600; }
.error { color: #b42318; }
@media (max-width: 700px) {
  .setup-page { padding: 12px; }
  .site-header { padding: 12px 16px; }
  .setup-card { margin-top: 12px; padding: 24px 18px; }
  .heading-row { flex-direction: column-reverse; }
  h1 { font-size: 26px; }
  .field-grid { grid-template-columns: 1fr; }
  .form-footer { flex-direction: column-reverse; align-items: stretch; }
  .primary-button { width: 100%; }
}
</style>
