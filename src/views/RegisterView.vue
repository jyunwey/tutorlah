<script setup>
import { ref } from "vue";

import {
  registerUser,
} from "../services/auth.js";

const firstName = ref("");
const lastName = ref("");
const email = ref("");
const password = ref("");
const role = ref("");

const message = ref("");
const messageType = ref("");
const isSubmitting = ref(false);

async function handleRegistration() {
  message.value =
    "Creating your account...";

  messageType.value = "loading";
  isSubmitting.value = true;

  try {
    const user = await registerUser({
      firstName: firstName.value,
      lastName: lastName.value,
      email: email.value,
      password: password.value,
      role: role.value,
    });

    console.log(
      "Registered Firebase UID:",
      user.uid
    );

    message.value =
      "Account created successfully. " +
      "Please check your email.";

    messageType.value = "success";

    firstName.value = "";
    lastName.value = "";
    email.value = "";
    password.value = "";
    role.value = "";
  } catch (error) {
    console.error(
      "Registration failed:",
      error
    );

    messageType.value = "error";

    switch (error.code) {
      case "auth/email-already-in-use":
        message.value =
          "This email is already registered.";
        break;

      case "auth/invalid-email":
        message.value =
          "Please enter a valid email.";
        break;

      case "auth/weak-password":
        message.value =
          "Please choose a stronger password.";
        break;

      case "auth/network-request-failed":
        message.value =
          "Network error. Check your connection.";
        break;

      default:
        message.value =
          error.message ||
          "Account creation failed.";
    }
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <main class="register-page">
    <section class="register-card">
      <h1>Create an account</h1>

      <form
        class="register-form"
        @submit.prevent="handleRegistration"
      >
        <div class="form-field">
          <label for="first-name">
            First name
          </label>

          <input
            id="first-name"
            v-model.trim="firstName"
            type="text"
            autocomplete="given-name"
            required
          />
        </div>

        <div class="form-field">
          <label for="last-name">
            Last name
          </label>

          <input
            id="last-name"
            v-model.trim="lastName"
            type="text"
            autocomplete="family-name"
            required
          />
        </div>

        <div class="form-field">
          <label for="email">
            Email
          </label>

          <input
            id="email"
            v-model.trim="email"
            type="email"
            autocomplete="email"
            required
          />
        </div>

        <div class="form-field">
          <label for="password">
            Password
          </label>

          <input
            id="password"
            v-model="password"
            type="password"
            minlength="8"
            autocomplete="new-password"
            required
          />

          <small>
            Use at least 8 characters.
          </small>
        </div>

        <div class="form-field">
          <label for="role">
            Account type
          </label>

          <select
            id="role"
            v-model="role"
            required
          >
            <option disabled value="">
              Select an account type
            </option>

            <option value="student">
              Student
            </option>

            <option value="tutor">
              Tutor
            </option>
          </select>
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
        >
          {{
            isSubmitting
              ? "Creating account..."
              : "Create account"
          }}
        </button>
      </form>

      <p
        v-if="message"
        class="form-message"
        :class="messageType"
        aria-live="polite"
      >
        {{ message }}
      </p>
    </section>
  </main>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px 20px;
  box-sizing: border-box;
  background: #f5f5f5;
}

.register-card {
  width: 100%;
  max-width: 480px;
  padding: 28px;
  box-sizing: border-box;
  background: white;
  border-radius: 12px;
}

.register-form {
  display: grid;
  gap: 18px;
}

.form-field {
  display: grid;
  gap: 6px;
}

input,
select,
button {
  width: 100%;
  padding: 12px;
  box-sizing: border-box;
  font: inherit;
}

button {
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.form-message.success {
  color: green;
}

.form-message.error {
  color: red;
}

.form-message.loading {
  color: black;
}
</style>