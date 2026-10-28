<script setup>
import AuthLayout from "../components/AuthLayout.vue";
import { ref, computed } from "vue";
import { useRouter, RouterLink } from "vue-router";

import {
  registerUser,
} from "../services/auth.js";

const router = useRouter();

const firstName = ref("");
const lastName = ref("");
const email = ref("");
const password = ref("");
const role = ref("");

const message = ref("");
const messageType = ref("");
const isSubmitting = ref(false);

const isEmailValid = computed(() => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
});

const isPasswordValid = computed(() => {
  return (
    password.value.length >= 8 &&
    /[A-Z]/.test(password.value) &&
    /[^A-Za-z0-9]/.test(password.value)
  );
});

const isFormValid = computed(() => {
  return (
    firstName.value.trim() !== "" &&
    lastName.value.trim() !== "" &&
    isEmailValid.value &&
    isPasswordValid.value &&
    ["student", "tutor"].includes(role.value)
  );
});

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
      "Registered successfully. " +
      "Please check your email to verify your account before logging in.";

    messageType.value = "success";

    // Redirect to Login after 4 seconds
    setTimeout(() => {
      router.replace("/login");
    }, 4000);

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
  <AuthLayout> 
    <template #branding>
      <h2>
        Join<br>
        TutorLah<br>
        today.
      </h2>

      <p>
        Create an account and start your
        learning journey with trusted
        tutors and students in Singapore.
      </p>

      <div class="feature">
        <img src="/signup/icon-community.png" alt="" class="feature-icon" />

        <div class="feature-text">
          <h4>Join a trusted community</h4>
          <p>Connect with genuine users</p>
        </div>
      </div>

      <div class="feature">
        <img src="/signup/icon-match.png" alt="" class="feature-icon" />

        <div class="feature-text">
          <h4>Find the right match</h4>
          <p>Personalised to your needs</p>
        </div>
      </div>

      <div class="feature">
        <img src="/signup/icon-goals.png" alt="" class="feature-icon" />

        <div class="feature-text">
          <h4>Achieve your goals</h4>
          <p>Flexible and convenient learning</p>
        </div>
      </div>
    </template>

  
    <h1>Create an account</h1>
    <h3>Join TutorLah and start your learning journey today.</h3>

    <form
      class="register-form"
      @submit.prevent="handleRegistration"
    >

    <div class="role-selection">
      <button
        type="button"
        class="role-card"
        :class="{ selected: role === 'student' }"
        :aria-pressed="role === 'student'"
        @click="role = 'student'"
      >
        <img class="role-icon" src="/signup/icon-student-parent.svg" alt="icon-student-parent" />
        <span>Student / Parent</span>
      </button>

      <button
        type="button"
        class="role-card"
        :class="{ selected: role === 'tutor' }"
        :aria-pressed="role === 'tutor'"
        @click="role = 'tutor'"
      >
        <img class="role-icon" src="/signup/icon-tutor.svg" alt="icon-tutor" />
        <span>Tutor</span>
      </button>
    </div>

      <div class="form-field">
        <label for="first-name">
          First name
          <span class="required">*</span>
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
          <span class="required">*</span>
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
          <span class="required">*</span>
        </label>

        <input
          id="email"
          v-model.trim="email"
          type="email"
          autocomplete="email"
          required
        />
        <small
          v-if="email && !isEmailValid"
          class="validation-error"
        >
          Please enter a valid email address.
        </small>
      </div>

      <div class="form-field">
        <label for="password">
          Password
          <span class="required">*</span>
        </label>

        <input
          id="password"
          v-model="password"
          type="password"
          minlength="8"
          autocomplete="new-password"
          required
        />

        <small
          v-if="password && !isPasswordValid"
          class="validation-error"
        >
          Password must have at least 8 characters, 1 uppercase letter and 1 special character.
        </small>
      </div>

      <button
        type="submit"
        class="submit-btn"
        :disabled="!isFormValid || isSubmitting"
      >
        {{ isSubmitting ? "Creating account..." : "Create account" }}
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

    <div class="divider">
      <span>or</span>
    </div>

    <p class="auth-switch">
      Already have an account?
      <RouterLink to="/login">Log In</RouterLink>
    </p>
  </AuthLayout>
</template>


<style scoped>
h1 {
  font-size: 25px;
  font-weight: 700;
  text-align: center;
  margin: 0 0 5px;
}

h3 {
  font-size: 13px;
  color:#52658a;
  font-weight: 300;
  text-align: center;
  margin: 0 0 20px;
}

.role-selection {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.role-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;

  padding: 10px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;

  background: #f8f9fb;
  color: #0F1B4C;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;

  transition: all 0.2s ease;
}

.role-icon {
  width: 35px;
}

.role-card.selected {
  background: #e4fff3;
  border-color: #3dc392;
}

.role-card:hover {
  border-color: #3dc392;
}

.register-form {
  display: grid;
  gap: 16px;
}

.form-field {
  display: grid;
  gap: 6px;
}

.form-field label {
  font-size: 14px;
  font-weight: 600;
  color: #0F1B4C;
}

input,
select {
  width: 100%;
  padding: 12px;
  border: 1px solid #d5dce5;
  border-radius: 6px;
  box-sizing: border-box;
}

.submit-btn {
  width: 100%;
  padding: 13px;
  background: #00875a;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, opacity 0.2s ease;
}

/* Form incomplete */
.submit-btn:disabled {
  background: #7ba994;
  cursor: not-allowed;
  opacity: 1;
}

/* Form complete */
.submit-btn:not(:disabled) {
  background: #00875a;
}

/* Hover when enabled */
.submit-btn:not(:disabled):hover {
  background: #006b47;
}

.form-message.success {
  color: green;
  font-size: 13px;
}

.form-message.error {
  color: red;
  font-size: 13px;
}

.form-message.loading {
  color: #52658a;
  font-size: 13px;
}

.validation-error {
  color: red;
  font-size: 12px;
}

.required {
  color: red;
  font-weight: 600;
}

.divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 20px 0;
  color: #9ca3af;
  font-size: 13px;
}

.divider::before,
.divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background-color: #d5dce5;
}
</style>