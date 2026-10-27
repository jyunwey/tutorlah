<script setup>
import { ref } from "vue";
import AuthLayout from "../components/AuthLayout.vue";
import { loginUser } from "../services/auth.js";
import { useRouter, RouterLink } from "vue-router";

const router = useRouter();

const email = ref("");
const password = ref("");

const errorMessage = ref("");
const isSubmitting = ref(false);

async function handleLogin() {
  errorMessage.value = "";
  isSubmitting.value = true;

  try {
    const user = await loginUser(
      email.value,
      password.value
    );

    console.log("Login successful:", user.uid);

    await router.replace("/home");

  } catch (error) {
    console.error("Login failed:", error);

    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        errorMessage.value =
          "Invalid email or password.";
        break;

      case "auth/invalid-email":
        errorMessage.value =
          "Please enter a valid email address.";
        break;

      case "auth/network-request-failed":
        errorMessage.value =
          "Network error. Please try again.";
        break;

      case "auth/email-not-verified":
        errorMessage.value =
          "Please verify your email before logging in. Check your inbox.";
        break;

      default:
        errorMessage.value =
          "Login failed. Please try again.";
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
        Better<br />
        Learning.<br />
        Brighter<br />
        Futures.
      </h2>

      <p>
        Connecting students, parents and tutors in
        Singapore through smarter matching.
      </p>

      <div class="feature">
        <img
          src="/login/icon-find-tutors.png"
          alt=""
          class="feature-icon"
        />
        <div class="feature-text">
          <h4>Find trusted tutors</h4>
          <p>Learn with confidence</p>
        </div>
      </div>

      <div class="feature">
        <img
          src="/login/icon-assignments.png"
          alt=""
          class="feature-icon"
        />
        <div class="feature-text">
          <h4>Post or find assignments</h4>
          <p>Flexible learning options</p>
        </div>
      </div>

      <div class="feature">
        <img
          src="/login/icon-sprout.png"
          alt=""
          class="feature-icon"
        />
        <div class="feature-text">
          <h4>Build brighter futures</h4>
          <p>Together in Singapore</p>
        </div>
      </div>
    </template>

    <h1>Welcome to TutorLah</h1>
    <p class="subtitle">Log in to continue</p>

    <form class="login-form" @submit.prevent = "handleLogin">
      <div class="form-field">
        <label for="email">Email address</label>
        <input
          id="email"
          v-model.trim="email"
          type="email"
          placeholder="you@example.com"
          autocomplete="email"
          required
        />
      </div>

      <div class="form-field">
        <label for="password">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          placeholder="Enter your password"
          autocomplete="current-password"
          required
        />
      </div>

      <button type="submit" 
              class="login-btn"
              :disabled="isSubmitting">
        {{ isSubmitting ? "Logging in..." : "Log In" }}
      </button>
      <p
        v-if="errorMessage"
        class="error-message"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <p class="auth-switch">
        Don't have an account?
        <RouterLink to="/register">Sign Up</RouterLink>
      </p>

    </form>
  </AuthLayout>
</template>

<style scoped>
h1 {
  font-size: 25px;
  font-weight: 700;
  text-align: center;
  color: #0F1B4C;
  margin: 0 0 5px;
}

.subtitle {
  text-align: center;
  color: #52658a;
  font-size: 13px;
  margin: 0 0 24px;
}

.login-form {
  display: grid;
  gap: 18px;
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

.form-field input {
  width: 100%;
  padding: 12px;
  border: 1px solid #d5dce5;
  border-radius: 6px;
  font: inherit;
}

.login-btn {
  width: 100%;
  padding: 13px;
  background: #00875a;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.login-btn:hover {
  background: #006b47;
}

.error-message {
  color: red;
  font-size: 13px;
  text-align: center;
  margin: 0;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>