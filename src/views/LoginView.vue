<script setup>
import { ref } from "vue";
import AuthLayout from "../components/AuthLayout.vue";

const email = ref("");
const password = ref("");
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
    <p class="subtitle">Sign in to continue</p>

    <form class="login-form" @submit.prevent>
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

      <button type="submit" class="login-btn">
        Log In
      </button>
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
</style>