<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const isRetrying = ref(false);

const retryPath = computed(() => {
  const requested = route.query.redirect;
  return typeof requested === "string" && requested.startsWith("/")
    && !requested.startsWith("//")
    && !requested.startsWith("/account-error")
    ? requested
    : "/home";
});

async function retry() {
  isRetrying.value = true;
  try {
    await router.replace(retryPath.value);
  } finally {
    isRetrying.value = false;
  }
}
</script>

<template>
  <main class="account-error-page">
    <section class="error-card" aria-labelledby="account-error-heading">
      <p class="eyebrow">TutorLah</p>
      <h1 id="account-error-heading">We could not load your account</h1>
      <p>
        Protected pages are temporarily unavailable because your account details
        could not be verified. Check your connection, then try again.
      </p>
      <button type="button" :disabled="isRetrying" @click="retry">
        {{ isRetrying ? "Retrying..." : "Try again" }}
      </button>
    </section>
  </main>
</template>

<style scoped>
.account-error-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 24px;
  box-sizing: border-box;
  background: var(--page-background);
  color: var(--color-text);
  font-family: var(--font-sans);
}

.error-card {
  max-width: 520px;
  padding: 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  text-align: center;
}

.eyebrow {
  margin: 0;
  color: var(--color-primary);
  font-weight: 800;
}

h1 {
  margin: 8px 0 12px;
}

.error-card > p:not(.eyebrow) {
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.6;
}

button {
  margin-top: 24px;
  padding: 11px 22px;
  border: 0;
  border-radius: var(--radius-control);
  background: var(--color-primary);
  color: white;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: wait;
}

button:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--color-primary) 35%, transparent);
  outline-offset: 3px;
}
</style>
