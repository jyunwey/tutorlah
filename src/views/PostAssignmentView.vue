<script setup>
import { reactive } from 'vue'

const form = reactive({
  subject: '',
  level: '',
  location: '',
  learningMode: 'In-person',
  minimumRate: '',
  maximumRate: '',
  schedule: '',
  teachingStyle: 'No preference',
  additionalDetails: '',
})

function handleSubmit() {
  console.log('Assignment form:', {
    ...form,
  })
}
</script>
<template>
  <main class="post-assignment-page">
    <h1>Post a Tuition Assignment</h1>

    <p>
      Enter your tuition requirements below.
    </p>

    <form
        class="assignment-form"
        @submit.prevent="handleSubmit"
    >
      <div>
        <label for="subject">
          Subject
        </label>

        <select id="subject" v-model="form.subject">
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
      </div>

      <div>
        <label for="level">
          Academic Level
        </label>

        <select id="level" v-model="form.level">
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
      </div>

      <div>
        <label for="location">
          Preferred Location
        </label>

        <select id="location" v-model="form.location">
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
      </div>

      <div>
        <label for="learning-mode">
          Preferred Learning Mode
        </label>

        <select id="learning-mode" v-model="form.learningMode">
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
      </div>

      <div>
        <label for="minimum-rate">
          Minimum Hourly Rate
        </label>

        <input
          id="minimum-rate"
          v-model="form.minimumRate"
          type="number"
        />
      </div>

      <div>
        <label for="maximum-rate">
          Maximum Hourly Rate
        </label>

        <input
          id="maximum-rate"
          v-model="form.maximumRate"
          type="number"
        />
      </div>

      <div>
        <label for="schedule">
          Preferred Schedule
        </label>

        <input
          id="schedule"
          v-model.trim="form.schedule"
          type="text"
        />
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

    <footer class="form-actions">
    <button
        class="cancel-button"
        type="button"
    >
        Cancel
    </button>

    <button
        class="submit-button"
        type="submit"
    >
        Post Assignment
    </button>
    </footer>
    </form>
  </main>
</template>
<style scoped>
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