<script setup>
import {
  reactive,
  ref,
} from 'vue'
import {
  useRouter,
} from 'vue-router'

import AppNavBar from '../components/AppNavBar.vue'
import {
  useCurrentAccount,
} from '../composables/useCurrentAccount.js'
import {
  createAssignment,
} from '../services/assignments.js'

const router = useRouter()

const {
  account,
} = useCurrentAccount()

const form = reactive({
  subject: '',
  level: '',
  location: '',
  learningMode: 'In-person',
  minimumRate: '',
  maximumRate: '',
  preferredDay: '',
  preferredTimeSlot: '',  
  teachingStyle: 'No preference',
  additionalDetails: '',
})

const errors = reactive({})
const formMessage = ref('')
const formMessageType = ref('')
const isSubmitting = ref(false)

function clearError(fieldName) {
  delete errors[fieldName]
}

function clearErrors() {
  Object.keys(errors).forEach((fieldName) => {
    delete errors[fieldName]
  })
}

function validateForm() {
  clearErrors()

  if (!form.subject) {
    errors.subject = 'Please select a subject.'
  }

  if (!form.level) {
    errors.level = 'Please select an academic level.'
  }

  if (!form.location) {
    errors.location = 'Please select a preferred location.'
  }

  if (!form.learningMode) {
    errors.learningMode = 'Please select a learning mode.'
  }

  const minimumRate = Number(form.minimumRate)
  const maximumRate = Number(form.maximumRate)

  if (
    form.minimumRate === ''
    || !Number.isFinite(minimumRate)
    || minimumRate <= 0
  ) {
    errors.minimumRate =
      'Please enter a valid minimum rate.'
  }

  if (
    form.maximumRate === ''
    || !Number.isFinite(maximumRate)
    || maximumRate <= 0
  ) {
    errors.maximumRate =
      'Please enter a valid maximum rate.'
  }

  if (
    !errors.minimumRate
    && !errors.maximumRate
    && maximumRate < minimumRate
  ) {
    errors.maximumRate =
      'Maximum rate cannot be lower than minimum rate.'
  }

  return Object.keys(errors).length === 0
}

async function handleSubmit() {
  formMessage.value = ''
  formMessageType.value = ''

  if (!validateForm()) {
    formMessage.value =
      'Please correct the highlighted fields.'

    formMessageType.value = 'error'
    return
  }

  if (isSubmitting.value) {
    return
  }

  isSubmitting.value = true

  try {
    const assignmentId =
      await createAssignment({
        ...form,
      })

    console.log(
      'Created assignment:',
      assignmentId
    )

    formMessage.value =
      'Assignment posted successfully.'

    formMessageType.value = 'success'
  } catch (error) {
    console.error(
      'Failed to post assignment:',
      error
    )

    if (error.code === 'auth/no-current-user') {
      formMessage.value =
        'Please sign in before posting an assignment.'
    } else if (error.code === 'permission-denied') {
      formMessage.value =
        'You do not have permission to post an assignment.'
    } else {
      formMessage.value =
        'Could not post the assignment. Please try again.'
    }

    formMessageType.value = 'error'
  } finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
  if (isSubmitting.value) {
    return
  }

  router.back()
}
</script>

<template>
  <main class="post-assignment-page">
    <div class="page-nav">
      <AppNavBar :account="account" />
    </div>

    <header class="page-header">
      <h1>
        Post a Tuition Assignment
      </h1>

      <p>
        Enter your tuition requirements below.
      </p>
    </header>

    <form
        class="assignment-form"
        novalidate
        @submit.prevent="handleSubmit"
    >
      <div>
        <label for="subject">
          Subject *
        </label>

        <select
          id="subject"
          v-model="form.subject"
          :aria-invalid="Boolean(errors.subject)"
          @change="clearError('subject')"
        >
          <option value="">
            Select a subject
          </option>

          <option value="English">
            English
          </option>

          <option value="Mathematics">
            Mathematics
          </option>

          <option value="Science">
            Science
          </option>
        </select>

        <p
          v-if="errors.subject"
          class="field-error"
        >
          {{ errors.subject }}
        </p>
      </div>

     <div>
        <label for="level">
          Academic Level *
        </label>

        <select
          id="level"
          v-model="form.level"
          :aria-invalid="Boolean(errors.level)"
          @change="clearError('level')"
        >
          <option value="">
            Select an academic level
          </option>

          <option value="Primary">
            Primary
          </option>

          <option value="Secondary">
            Secondary
          </option>

          <option value="Junior College">
            Junior College
          </option>
        </select>

        <p
          v-if="errors.level"
          class="field-error"
        >
          {{ errors.level }}
        </p>
      </div>

      <div>
        <label for="location">
          Preferred Location *
        </label>

        <select
          id="location"
          v-model="form.location"
          :aria-invalid="Boolean(errors.location)"
          @change="clearError('location')"
        >
          <option value="">
            Select a location
          </option>

          <option value="North">
            North
          </option>

          <option value="South">
            South
          </option>

          <option value="East">
            East
          </option>

          <option value="West">
            West
          </option>

          <option value="Central">
            Central
          </option>
        </select>

        <p
          v-if="errors.location"
          class="field-error"
        >
          {{ errors.location }}
        </p>
      </div>

      <div>
        <label for="learning-mode">
          Preferred Learning Mode *
        </label>

        <select
          id="learning-mode"
          v-model="form.learningMode"
          :aria-invalid="Boolean(errors.learningMode)"
          @change="clearError('learningMode')"
        >
          <option value="In-person">
            In-person
          </option>

          <option value="Online">
            Online
          </option>

          <option value="Either">
            Either
          </option>
        </select>

        <p
          v-if="errors.learningMode"
          class="field-error"
        >
          {{ errors.learningMode }}
        </p>
      </div>

      <div>
        <label for="minimum-rate">
          Minimum Hourly Rate *
        </label>

        <input
          id="minimum-rate"
          v-model.number="form.minimumRate"
          type="number"
          min="1"
          :aria-invalid="Boolean(errors.minimumRate)"
          @input="clearError('minimumRate')"
        />

        <p
          v-if="errors.minimumRate"
          class="field-error"
        >
          {{ errors.minimumRate }}
        </p>
      </div>

      <div>
        <label for="maximum-rate">
          Maximum Hourly Rate *
        </label>

        <input
          id="maximum-rate"
          v-model.number="form.maximumRate"
          type="number"
          min="1"
          :aria-invalid="Boolean(errors.maximumRate)"
          @input="clearError('maximumRate')"
        />

        <p
          v-if="errors.maximumRate"
          class="field-error"
        >
          {{ errors.maximumRate }}
        </p>
      </div>

      <div>
        <label for="preferred-day">
          Preferred Day
        </label>

        <select
          id="preferred-day"
          v-model="form.preferredDay"
        >
          <option value="">
            Select a preferred day
          </option>

          <option value="Monday">
            Monday
          </option>

          <option value="Tuesday">
            Tuesday
          </option>

          <option value="Wednesday">
            Wednesday
          </option>

          <option value="Thursday">
            Thursday
          </option>

          <option value="Friday">
            Friday
          </option>

          <option value="Saturday">
            Saturday
          </option>

          <option value="Sunday">
            Sunday
          </option>
        </select>
      </div>

      <div>
        <label for="preferred-time-slot">
          Preferred Time Slot
        </label>

        <select
          id="preferred-time-slot"
          v-model="form.preferredTimeSlot"
        >
          <option value="">
            Select a preferred time slot
          </option>

          <option value="08:00-10:00">
            8:00 AM - 10:00 AM
          </option>

          <option value="10:00-12:00">
            10:00 AM - 12:00 PM
          </option>

          <option value="12:00-14:00">
            12:00 PM - 2:00 PM
          </option>

          <option value="14:00-16:00">
            2:00 PM - 4:00 PM
          </option>

          <option value="16:00-18:00">
            4:00 PM - 6:00 PM
          </option>

          <option value="18:00-20:00">
            6:00 PM - 8:00 PM
          </option>

          <option value="20:00-22:00">
            8:00 PM - 10:00 PM
          </option>
        </select>
      </div>

      <div>
        <label for="teaching-style">
          Preferred Teaching Style
        </label>

        <select id="teaching-style" v-model="form.teachingStyle">
          <option value="No preference">
            No preference
          </option>

          <option value="Patient">
            Patient
          </option>

          <option value="Exam-focused">
            Exam-focused
          </option>

          <option value="Interactive">
            Interactive
          </option>
        </select>
      </div>

      <div>
        <label for="additional-details">
          Additional Details
        </label>

        <textarea
          id="additional-details"
          v-model.trim="form.additionalDetails"
          rows="5"
        ></textarea>
      </div>

    <p
      v-if="formMessage"
      class="form-message"
      :class="formMessageType"
      aria-live="polite"
    >
      {{ formMessage }}
    </p>

    <footer class="form-actions">
    <button
        class="cancel-button"
        type="button"
        @click="handleCancel"
    >
        Cancel
    </button>

    <button
      class="submit-button"
      type="submit"
      :disabled="isSubmitting"
    >
      {{
        isSubmitting
          ? 'Posting...'
          : 'Post Assignment'
      }}
    </button>
    </footer>
    </form>
  </main>
</template>

<style scoped>
.post-assignment-page {
  min-height: 100vh;
  padding: 24px 20px 48px;
  box-sizing: border-box;
  background: var(--page-background);
  color: var(--color-text);
  font-family: var(--font-sans);
}

.page-nav {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto 32px;
}

.page-header,
.assignment-form {
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
  font-weight: 800;
  letter-spacing: -0.02em;
}

.page-header p {
  margin-top: 8px;
  color: var(--color-text-muted);
  font-size: 1.1rem;
}

.assignment-form {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 24px;
  padding: 32px;
  box-sizing: border-box;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.assignment-form > div {
  display: grid;
  align-content: start;
  gap: 8px;
}

/* Additional Details occupies the full row. */
.assignment-form > div:last-of-type {
  grid-column: 1 / -1;
}

label {
  color: var(--color-text);
  font-weight: 600;
}

input,
select,
textarea {
  width: 100%;
  padding: 12px 14px;
  box-sizing: border-box;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease;
}

input:hover,
select:hover,
textarea:hover {
  border-color: var(--color-text-muted);
}

input:focus,
select:focus,
textarea:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow:
    0 0 0 3px
    color-mix(
      in srgb,
      var(--color-primary) 18%,
      transparent
    );
}

textarea {
  min-height: 130px;
  resize: vertical;
}

.form-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border);
}

button {
  min-width: 150px;
  padding: 12px 20px;
  border-radius: var(--radius-control);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 150ms ease,
    border-color 150ms ease,
    transform 150ms ease;
}

button:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 3px;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.cancel-button {
  border: 1px solid var(--color-primary);
  background: var(--color-surface);
  color: var(--color-primary);
}

.cancel-button:not(:disabled):hover {
  background: var(--color-primary-light);
}

.submit-button {
  border: 1px solid var(--color-primary);
  background: var(--color-primary);
  color: white;
}

.submit-button:not(:disabled):hover {
  border-color: var(--color-primary-dark);
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

[aria-invalid='true'] {
  border-color: var(--color-error);
  box-shadow:
    0 0 0 2px
    color-mix(
      in srgb,
      var(--color-error) 15%,
      transparent
    );
}

.field-error {
  margin: 0;
  color: var(--color-error);
  font-size: 0.82rem;
  font-weight: 600;
}

.form-message {
  grid-column: 1 / -1;
  margin: 0;
  padding: 13px 15px;
  border-radius: var(--radius-control);
  font-weight: 600;
}

.form-message.error {
  border: 1px solid var(--color-error);
  background: #fdf1ef;
  color: var(--color-error);
}

.form-message.success {
  border: 1px solid var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
}

@media (max-width: 700px) {
  .post-assignment-page {
    padding: 16px 14px 36px;
  }

  .page-nav {
    margin-bottom: 24px;
  }

  .page-header h1 {
    font-size: 2rem;
  }

  .assignment-form {
    grid-template-columns: 1fr;
    padding: 24px 18px;
  }

  .assignment-form > div:last-of-type,
  .form-message,
  .form-actions {
    grid-column: auto;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  button {
    width: 100%;
  }
}
</style>