<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";

import { useCurrentAccount } from "../composables/useCurrentAccount.js";
import { logoutUser } from "../services/auth.js";

const props = defineProps({
  account: {
    type: Object,
    default: undefined,
  },
});

const router = useRouter();
const route = useRoute();
const ownAccount = props.account === undefined ? useCurrentAccount().account : null;

const currentAccount = computed(() =>
  props.account !== undefined ? props.account : ownAccount?.value || null,
);

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
  if (!currentAccount.value) return [];
  const roleLinks =
    currentAccount.value.role === "tutor" ? TUTOR_LINKS : STUDENT_LINKS;
  return roleLinks.filter((link) =>
    router.getRoutes().some((item) => item.path === link.path),
  );
});

const initials = computed(() =>
  `${currentAccount.value?.firstName?.charAt(0) || ""}${currentAccount.value?.lastName?.charAt(0) || ""}`.toUpperCase(),
);

const fullName = computed(() =>
  [currentAccount.value?.firstName, currentAccount.value?.lastName]
    .filter(Boolean)
    .join(" "),
);

const roleLabel = computed(() =>
  currentAccount.value?.role === "tutor" ? "Tutor" : "Student / Parent",
);

const menuOpen = ref(false);
const menuRoot = ref(null);
const linksNav = ref(null);
const isLoggingOut = ref(false);
const logoutError = ref("");

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

function closeMenu() {
  menuOpen.value = false;
}

function handleOutsideClick(event) {
  if (menuRoot.value && !menuRoot.value.contains(event.target)) closeMenu();
}

function handleKeydown(event) {
  if (event.key === "Escape") closeMenu();
}

async function handleLogout() {
  isLoggingOut.value = true;
  logoutError.value = "";
  try {
    await logoutUser();
    closeMenu();
    await router.push(router.hasRoute("login") ? "/login" : "/register");
  } catch (error) {
    console.error("Could not log out:", error);
    logoutError.value = "Could not log out. Please try again.";
  } finally {
    isLoggingOut.value = false;
  }
}

function revealActiveLink() {
  linksNav.value
    ?.querySelector(".router-link-active")
    ?.scrollIntoView({ block: "nearest", inline: "nearest" });
}

watch(() => route.fullPath, closeMenu);
watch([() => route.fullPath, links], revealActiveLink, { flush: "post" });

onMounted(() => {
  document.addEventListener("click", handleOutsideClick);
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("click", handleOutsideClick);
  document.removeEventListener("keydown", handleKeydown);
});
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

    <nav v-if="currentAccount" ref="linksNav" class="links" aria-label="Main navigation">
      <RouterLink v-for="link in links" :key="link.path" :to="link.path">
        {{ link.label }}
      </RouterLink>
    </nav>

    <div v-if="currentAccount" ref="menuRoot" class="account-menu">
      <button
        type="button"
        class="avatar"
        :class="{ active: route.path === '/profile' }"
        aria-label="Account menu"
        aria-haspopup="menu"
        :aria-expanded="menuOpen"
        @click="toggleMenu"
      >
        {{ initials }}
      </button>

      <div v-if="menuOpen" class="dropdown" role="menu">
        <div class="dropdown-header">
          <p class="dropdown-name">{{ fullName }}</p>
          <p class="dropdown-role">{{ roleLabel }}</p>
        </div>
        <RouterLink to="/profile" class="dropdown-item" role="menuitem">
          My Profile
        </RouterLink>
        <button
          type="button"
          class="dropdown-item logout"
          role="menuitem"
          :disabled="isLoggingOut"
          @click="handleLogout"
        >
          {{ isLoggingOut ? "Logging out..." : "Log out" }}
        </button>
        <p v-if="logoutError" class="dropdown-error" role="alert">{{ logoutError }}</p>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-nav {
  box-sizing: border-box;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
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
.account-menu {
  position: relative;
  flex-shrink: 0;
  margin-left: auto;
}
.avatar {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--color-primary-light, #e7f4ee);
  color: var(--color-primary, #0f6b4f);
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
.avatar.active,
.avatar[aria-expanded="true"] {
  box-shadow: 0 0 0 2px var(--color-primary, #0f6b4f);
}
.dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 20;
  width: 220px;
  padding: 6px;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e3e7eb);
  border-radius: 10px;
  box-shadow: 0 12px 28px rgba(16, 24, 32, 0.12);
}
.dropdown-header {
  padding: 10px 12px 12px;
  margin-bottom: 4px;
  border-bottom: 1px solid var(--color-border, #e3e7eb);
}
.dropdown-header p {
  margin: 0;
}
.dropdown-name {
  color: var(--color-text, #1f2a30);
  font-size: 14px;
  font-weight: 700;
  overflow-wrap: anywhere;
}
.dropdown-role {
  margin-top: 2px;
  color: var(--color-text-muted, #5b6770);
  font-size: 12px;
}
.dropdown-item {
  display: block;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: 6px;
  background: none;
  color: var(--color-text, #1f2a30);
  font: inherit;
  font-size: 14px;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}
.dropdown-item:hover {
  background: var(--color-primary-light, #e7f4ee);
}
.dropdown-item.logout {
  color: #c62828;
  font-weight: 600;
}
.dropdown-item.logout:hover {
  background: #fdecec;
}
.dropdown-item:disabled {
  opacity: 0.6;
  cursor: wait;
}
.dropdown-error {
  margin: 4px 12px 8px;
  color: #c62828;
  font-size: 12px;
}
a:focus-visible,
button:focus-visible {
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
    flex-wrap: nowrap;
    gap: 10px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .links a {
    flex-shrink: 0;
    font-size: 13px;
    white-space: nowrap;
  }
}
</style>
