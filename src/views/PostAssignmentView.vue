<script setup>
import AppNavBar from "../components/AppNavBar.vue";
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  createAssignment,
} from '../services/assignments.js'

const router = useRouter()

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
      <AppNavBar />
    </div>
    <h1>Post a Tuition Assignment</h1>

    <p>
      Enter your tuition requirements below.
    </p>

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
.page-nav {
  margin-bottom: 32px;
}

.post-assignment-page {
  min-height: 100vh;
  padding: 48px 20px;
  box-sizing: border-box;
  color: #111111;
  background: #f4f4f4;
}

.post-assignment-page > h1,
.post-assignment-page > p,
.assignment-form {
  width: 100%;
  max-width: 900px;
  margin-right: auto;
  margin-left: auto;
}

.post-assignment-page > h1 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 36px;
}

.post-assignment-page > p {
  margin-top: 0;
  margin-bottom: 28px;
  color: #555555;
}

.assignment-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  padding: 32px;
  box-sizing: border-box;
  background: white;
  border: 1px solid #cccccc;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgb(0 0 0 / 8%);
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
  font-weight: 600;
}

input,
select,
textarea {
  width: 100%;
  padding: 12px;
  box-sizing: border-box;
  color: black;
  background: white;
  border: 1px solid #999999;
  border-radius: 6px;
  font: inherit;
}

input:focus,
select:focus,
textarea:focus {
  border-color: black;
  outline: 2px solid #dddddd;
}

textarea {
  min-height: 120px;
  resize: vertical;
}

.form-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
  padding-top: 24px;
  border-top: 1px solid #dddddd;
}

button {
  min-width: 140px;
  padding: 12px 20px;
  border-radius: 6px;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.cancel-button {
  color: black;
  background: white;
  border: 1px solid black;
}

.cancel-button:hover {
  background: #eeeeee;
}

.submit-button {
  color: white;
  background: black;
  border: 1px solid black;
}

.submit-button:hover {
  background: #333333;
}

[aria-invalid='true'] {
  border-color: black;
  outline: 2px solid #999999;
}

.field-error {
  margin: 0;
  color: black;
  font-size: 13px;
  font-weight: 600;
}

.form-message {
  grid-column: 1 / -1;
  margin: 0;
  padding: 12px;
  border: 1px solid black;
  border-radius: 6px;
}

.form-message.error {
  background: #eeeeee;
}

.form-message.success {
  background: white;
}

@media (max-width: 700px) {
  .post-assignment-page {
    padding: 28px 14px;
  }

  .post-assignment-page > h1 {
    font-size: 30px;
  }

  .assignment-form {
    grid-template-columns: 1fr;
    padding: 22px 18px;
  }

  .assignment-form > div:last-of-type,
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