<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { observeCurrentUser } from "../services/auth.js";
import ProfileForm from "../components/ProfileForm.vue";
import { createProfile } from "../services/profile.js";

const router = useRouter();
const account = ref(null);
const userId = ref("");
const isSaving = ref(false);
const saveError = ref("");
const isLoading = ref(true);
const isSignedIn = ref(false);
const errorMessage = ref("");
let unsubscribe;
let requestId = 0;

const isTutor = computed(() => account.value?.role === "tutor");
const roleLabel = computed(() => (isTutor.value ? "Tutor" : "Student / Parent"));
const subtitle = computed(() =>
  isTutor.value
    ? "Tell students and parents what you teach so they can find you."
    : "Tell us what you are looking for so we can match you with the right tutor.",
);

onMounted(() => {
  unsubscribe = observeCurrentUser(async (user) => {
    const currentRequest = ++requestId;
    account.value = null;
    errorMessage.value = "";
    isSignedIn.value = Boolean(user);
    userId.value = user?.uid || "";
    isLoading.value = true;

    if (!user) {
      isLoading.value = false;
      return;
    }

    try {
      const snapshot = await getDoc(doc(db, "users", user.uid));
      if (currentRequest !== requestId) return;
      if (snapshot.exists()) {
        account.value = snapshot.data();
      } else {
        errorMessage.value = "Your account details could not be found.";
      }
    } catch (error) {
      if (currentRequest !== requestId) return;
      console.error("Could not load account:", error);
      errorMessage.value = "We could not load your account. Please refresh and try again.";
    } finally {
      if (currentRequest === requestId) isLoading.value = false;
    }
  });
});

async function handleSubmit(values) {
  isSaving.value = true;
  saveError.value = "";
  try {
    await createProfile(userId.value, account.value, values);
    await router.push("/home");
  } catch (error) {
    console.error("Could not save profile:", error);
    saveError.value = "We could not save your profile. Please try again.";
  } finally {
    isSaving.value = false;
  }
}

onUnmounted(() => {
  requestId++;
  unsubscribe?.();
});
</script>

<template>
  <div class="setup-page">
    <div class="page-shell">
      <header class="site-header">
        <div class="brand" aria-label="TutorLah">
          <svg viewBox="0 0 40 36" aria-hidden="true">
            <path d="M2 12 20 3l18 9-18 9L2 12Z" fill="currentColor" />
            <path d="M9 18v9l11 6 11-6v-9l-11 6-11-6Z" fill="currentColor" />
            <path d="M4 15v11" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
            <circle cx="20" cy="11" r="2" fill="white" />
          </svg>
          <span>Tutor<span class="brand-green">Lah</span></span>
        </div>
      </header>

      <main class="setup-card" aria-labelledby="setup-title">
        <p v-if="isLoading" class="state-message" role="status">Loading...</p>

        <div v-else-if="!isSignedIn" class="state-message">
          <p>Please sign up or log in first.</p>
          <RouterLink to="/register" class="text-link">Go to Sign Up</RouterLink>
        </div>

        <p v-else-if="errorMessage" class="state-message error" role="alert">{{ errorMessage }}</p>

        <div v-else-if="account?.onboardingComplete" class="state-message">
          <p>Your profile is already set up.</p>
          <RouterLink to="/profile" class="text-link">Go to My Profile</RouterLink>
        </div>

        <template v-else-if="account">
          <div class="heading-row">
            <div>
              <h1 id="setup-title">Set Up Your Profile</h1>
              <p class="subtitle">Welcome, {{ account.firstName }}! {{ subtitle }}</p>
            </div>
            <span class="role-badge">{{ roleLabel }}</span>
          </div>

          <ProfileForm
            :role="account.role"
            submit-label="Save and Continue"
            :is-saving="isSaving"
            :save-error="saveError"
            @submit="handleSubmit"
          />
        </template>
      </main>
    </div>
  </div>
</template>

<style scoped>
.setup-page {
  min-height: 100vh;
  padding: 24px;
  box-sizing: border-box;
  background: linear-gradient(135deg, #f0fcf8, #f8fdfc 55%, #eafbf5);
  color: #11143d;
  font-family: Arial, Helvetica, sans-serif;
}
.setup-page *, .setup-page *::before, .setup-page *::after { box-sizing: border-box; }
.page-shell { max-width: 960px; margin: 0 auto; }
.site-header { display: flex; align-items: center; min-height: 72px; padding: 14px 24px; background: #fff; border: 1px solid #dceee8; border-radius: 9px; }
.brand { display: flex; align-items: center; gap: 8px; color: #101820; font-size: 25px; font-weight: 700; letter-spacing: -1px; }
.brand svg { width: 36px; height: 34px; color: #008563; }
.brand-green { color: #008563; }
.setup-card { margin-top: 20px; padding: 32px 32px 36px; background: rgba(255, 255, 255, .92); border: 1px solid #e1efeb; border-radius: 9px; }
.heading-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
h1 { margin: 0; font-size: 32px; line-height: 1.2; letter-spacing: -.9px; }
.subtitle { margin: 8px 0 0; color: #616999; font-size: 15px; line-height: 1.5; }
.role-badge { flex-shrink: 0; padding: 7px 14px; border-radius: 999px; background: #def5eb; color: #006c50; font-size: 13px; font-weight: 700; }
.state-message { padding: 24px 0; color: #616999; }
.state-message p { margin: 0 0 12px; }
.text-link { color: #008563; font-weight: 600; }
.error { color: #b42318; }
@media (max-width: 700px) {
  .setup-page { padding: 12px; }
  .site-header { padding: 12px 16px; }
  .setup-card { margin-top: 12px; padding: 24px 18px; }
  .heading-row { flex-direction: column-reverse; }
  h1 { font-size: 26px; }
}
</style>
