<script setup>
import { ref, computed } from "vue";
import { RouterLink } from "vue-router";
import { Mail } from "lucide-vue-next";
import AuthLayout from "../components/AuthLayout.vue";
import { resetPassword } from "../services/auth.js";

const email = ref("");
const isSubmitting = ref(false);
const message = ref("");
const messageType = ref("");

const isEmailValid = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())
);

async function handleReset() {
  if (!isEmailValid.value || isSubmitting.value) return;

  isSubmitting.value = true;
  message.value = "";

  try {
    await resetPassword(email.value.trim());

    message.value =
      "If an account exists for this email, a password reset link will be sent. Please check your inbox.";
    messageType.value = "success";
  } catch (error) {
    console.error("Password reset failed:", error);

    message.value =
      "Unable to send reset email. Please try again.";
    messageType.value = "error";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <AuthLayout>
    <template #branding>
      <h2>
        Reset Your<br />
        Password
      </h2>

      <p>
        We'll help you get back into your account.
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

    <div class="reset-header">
      <img
          src="/forgotpassword/icon-reset-email.png"
          alt="Password reset"
          class="reset-icon"
      />

      <h1>Reset Your Password</h1>
      <p class="subtitle">
        Enter your email address and we'll send you a link
        to reset your password.
      </p>
    </div>

    <form class="reset-form" @submit.prevent="handleReset">
      <div class="form-field">
        <label for="email">Email Address <span>*</span></label>

        <div class="input-wrapper">
          <Mail :size="19" class="input-icon" />

          <input
            id="email"
            v-model.trim="email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
            required
          />
        </div>

        <small
          v-if="email && !isEmailValid"
          class="validation-error"
        >
          Please enter a valid email address.
        </small>
      </div>

      <button
        type="submit"
        class="reset-btn"
        :disabled="!isEmailValid || isSubmitting"
      >
        {{ isSubmitting ? "Sending..." : "Send Reset Link" }}
      </button>
    </form>

    <p
      v-if="message"
      class="form-message"
      :class="messageType"
      role="status"
    >
      {{ message }}
    </p>

    <div class="back-login">
      <div class="divider">
        <span>or</span>
      </div>

      <RouterLink to="/login">
        Back to Login
      </RouterLink>
    </div>
  </AuthLayout>
</template>

<style scoped>
.reset-header {
  text-align: center;
  margin-bottom: 30px;
}

.mail-icon {
  display: grid;
  place-items: center;
  width: 105px;
  height: 105px;
  margin: 0 auto 20px;
  border-radius: 50%;
  background: #e4fff3;
  color: #00875a;
}

h1 {
  font-size: 27px;
  font-weight: 700;
  color: #0f1b4c;
  margin: 0 0 10px;
}

.subtitle {
  color: #52658a;
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
}

.reset-form {
  display: grid;
  gap: 20px;
}

.form-field {
  display: grid;
  gap: 8px;
}

.form-field label {
  font-size: 14px;
  font-weight: 600;
  color: #0f1b4c;
}

.form-field label span {
  color: red;
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #52658a;
}

.input-wrapper input {
  width: 100%;
  padding: 13px 14px 13px 44px;
  border: 1px solid #d5dce5;
  border-radius: 6px;
  box-sizing: border-box;
  font: inherit;
}

.input-wrapper input:focus {
  outline: none;
  border-color: #00875a;
}

.reset-btn {
  width: 100%;
  padding: 14px;
  background: #00875a;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.reset-btn:hover:not(:disabled) {
  background: #006b47;
}

.reset-btn:disabled {
  background: #7ba994;
  cursor: not-allowed;
}

.validation-error {
  color: red;
  font-size: 12px;
}

.form-message {
  margin-top: 16px;
  padding: 12px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
  text-align: center;
}

.form-message.success {
  background: #e4fff3;
  color: #00875a;
}

.form-message.error {
  background: #fdecec;
  color: red;
}

.back-login {
  margin-top: 24px;
  text-align: center;
}

.divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 22px;
  color: #52658a;
  font-size: 13px;
}

.divider::before,
.divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: #d5dce5;
}

.back-login a {
  color: #00875a;
  font-size: 14px;
  font-weight: 600;
  text-decoration: underline;
}

.reset-icon {
  width: 150px;
  object-fit: contain;
  display: block;
  margin: 0 auto 20px;
}


</style>