<script setup>
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";

import AppNavBar from "../components/AppNavBar.vue";

const route = useRoute();
const title = computed(() => route.meta.title || "This page");
</script>

<template>
  <div class="coming-soon-page">
    <div class="page-shell">
      <AppNavBar />

      <main class="coming-soon-card">
        <h1>{{ title }}</h1>
        <p>This page is coming soon.</p>
        <RouterLink to="/home" class="home-link">Back to Home</RouterLink>
      </main>
    </div>
  </div>
</template>

<style scoped>
.coming-soon-page {
  min-height: 100vh;
  padding: 24px;
  box-sizing: border-box;
  background: var(--page-background);
  color: var(--color-text, #1f2a30);
  font-family: var(--font-sans, Arial, Helvetica, sans-serif);
}
.page-shell {
  max-width: 1120px;
  margin: 0 auto;
}
.coming-soon-card {
  margin-top: 20px;
  padding: 64px 24px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid #e1efeb;
  border-radius: 9px;
  text-align: center;
}
h1 {
  margin: 0;
  font-size: 32px;
  letter-spacing: -0.9px;
}
p {
  margin: 10px 0 24px;
  color: var(--color-text-muted, #5b6770);
  font-size: 15px;
}
.home-link {
  color: var(--color-primary, #0f6b4f);
  font-weight: 600;
  text-decoration: none;
}
.home-link:hover {
  text-decoration: underline;
}
</style>
