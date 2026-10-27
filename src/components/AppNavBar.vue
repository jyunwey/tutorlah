<script setup>
import { computed } from "vue";
import { RouterLink, useRouter } from "vue-router";

const props = defineProps({
  account: {
    type: Object,
    default: null,
  },
});

const router = useRouter();

const STUDENT_LINKS = [
  { label: "Home", path: "/home" },
  { label: "Find Tutors", path: "/find-tutors" },
  { label: "Post Assignment", path: "/post-assignment" },
  { label: "My Matches", path: "/my-matches" },
];

const TUTOR_LINKS = [
  { label: "Home", path: "/home" },
  { label: "Find Assignments", path: "/find-assignments" },
  { label: "My Matches", path: "/my-matches" },
];

const links = computed(() => {
  if (!props.account) return [];
  const roleLinks =
    props.account.role === "tutor" ? TUTOR_LINKS : STUDENT_LINKS;
  return roleLinks.filter((link) =>
    router.getRoutes().some((route) => route.path === link.path),
  );
});

const initials = computed(() =>
  `${props.account?.firstName?.charAt(0) || ""}${props.account?.lastName?.charAt(0) || ""}`.toUpperCase(),
);
</script>

<template>
  <header class="app-nav">
    <RouterLink to="/home" class="brand" aria-label="TutorLah home">
      <svg viewBox="0 0 40 36" aria-hidden="true">
        <path d="M2 12 20 3l18 9-18 9L2 12Z" fill="currentColor" />
        <path d="M9 18v9l11 6 11-6v-9l-11 6-11-6Z" fill="currentColor" />
        <path d="M4 15v11" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        <circle cx="20" cy="11" r="2" fill="white" />
      </svg>
      <span>Tutor<span class="brand-accent">Lah</span></span>
    </RouterLink>

    <nav v-if="account" class="links" aria-label="Main navigation">
      <RouterLink v-for="link in links" :key="link.path" :to="link.path">
        {{ link.label }}
      </RouterLink>
    </nav>

    <RouterLink v-if="account" to="/profile" class="avatar" aria-label="My profile">
      {{ initials }}
    </RouterLink>
  </header>
</template>

<style scoped>
.app-nav {
  display: flex;
  align-items: center;
  gap: 32px;
  min-height: 64px;
  padding: 12px 24px;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e3e7eb);
  border-radius: 10px;
  font-family: var(--font-sans, Arial, Helvetica, sans-serif);
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text, #1f2a30);
  font-size: 23px;
  font-weight: 700;
  letter-spacing: -0.8px;
  text-decoration: none;
  flex-shrink: 0;
}
.brand svg {
  width: 32px;
  height: 30px;
  color: var(--color-primary, #0f6b4f);
}
.brand-accent {
  color: var(--color-primary, #0f6b4f);
}
.links {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 24px;
}
.links a {
  padding: 8px 0;
  border-bottom: 2px solid transparent;
  color: var(--color-text-muted, #5b6770);
  font-size: 14px;
  text-decoration: none;
}
.links a:hover {
  color: var(--color-primary, #0f6b4f);
}
.links a.router-link-active {
  color: var(--color-primary, #0f6b4f);
  border-bottom-color: var(--color-primary, #0f6b4f);
  font-weight: 600;
}
.avatar {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  margin-left: auto;
  border-radius: 50%;
  background: var(--color-primary-light, #e7f4ee);
  color: var(--color-primary, #0f6b4f);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}
.avatar.router-link-active {
  box-shadow: 0 0 0 2px var(--color-primary, #0f6b4f);
}
a:focus-visible {
  outline: 3px solid var(--color-primary, #0f6b4f);
  outline-offset: 3px;
}
@media (max-width: 700px) {
  .app-nav {
    flex-wrap: wrap;
    gap: 12px 16px;
    padding: 12px 16px;
  }
  .links {
    order: 3;
    flex-basis: 100%;
    gap: 18px;
  }
}
</style>
