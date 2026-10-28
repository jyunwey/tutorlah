<script setup>
import { ref } from "vue";
import AuthLayout from "../components/AuthLayout.vue";
import { loginUser } from "../services/auth.js";
import { useRouter, RouterLink } from "vue-router";
import { Eye, EyeOff } from "lucide-vue-next";
import {
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "firebase/auth";
import { auth } from "../firebase.js";

const router = useRouter();

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const rememberMe = ref(false);

const errorMessage = ref("");
const isSubmitting = ref(false);

async function handleLogin() {
  errorMessage.value = "";
  isSubmitting.value = true;
  
  // retain auth session for current browser session
  try {
    await setPersistence(
      auth,
      rememberMe.value
        ? browserLocalPersistence
        : browserSessionPersistence
    );

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
        <label for="email">Email address
          <span class="required">*</span>
        </label>
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
        <label for="password">Password
          <span class="required">*</span>
        </label>
        <div class="password-wrapper">
          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Enter your password"
            autocomplete="current-password"
            required
          />

          <button
            type="button"
            class="password-toggle"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            :aria-pressed="showPassword"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" :size="20" />
            <Eye v-else :size="20" />
          </button>
        </div>
      </div>

      <div class="login-options">
        <div class="remember-me">
          <label>
            <input
              type="checkbox"
              v-model="rememberMe"
            />
            Remember me
          </label>
        </div>

        <RouterLink to="/forgot-password" class="forgot-link">
          Forgot password?
        </RouterLink>
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

      <div class="divider">
        <span>or</span>
      </div>

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

.password-wrapper {
  position: relative;
}

.password-wrapper input {
  width: 100%;
  padding-right: 48px;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #52658a;
}

.password-toggle:hover {
  color: #00875a;
}

.remember-me label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #52658a;
}

.remember-me input {
  width: 15px;
  height: 15px;
  margin: 0;
  accent-color: #00875a;
  cursor: pointer;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.forgot-link {
  color: #00875a;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
}

.forgot-link:hover {
  text-decoration: underline;
}

.required {
  color: red;
  font-weight: 600;
}

.divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 12px 0;
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