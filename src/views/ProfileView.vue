<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { observeCurrentUser } from "../services/auth.js";
import AppNavBar from "../components/AppNavBar.vue";
import ProfileForm from "../components/ProfileForm.vue";
import { LEVELS } from "../constants/tutorFilters.js";
import { updateProfile } from "../services/profile.js";

const profile = ref(null);
const tutorProfile = ref(null);
const userId = ref("");
const isEditing = ref(false);
const isSaving = ref(false);
const saveError = ref("");
const saveMessage = ref("");
const isLoading = ref(true);
const isSignedIn = ref(false);
const errorMessage = ref("");
let unsubscribe;
let requestId = 0;

const isTutor = computed(() => profile.value?.role === "tutor");
const fullName = computed(() =>
  [profile.value?.firstName, profile.value?.lastName].filter(Boolean).join(" "),
);
const initials = computed(() =>
  `${profile.value?.firstName?.charAt(0) || ""}${profile.value?.lastName?.charAt(0) || ""}`.toUpperCase(),
);
const roleLabel = computed(() => {
  if (isTutor.value) return "Tutor";
  if (profile.value?.role === "student") return "Student / Parent";
  return "Unknown role";
});

const LEVEL_LABELS = Object.fromEntries(LEVELS.map((level) => [level.value, level.label]));

function levelLabel(value) {
  return LEVEL_LABELS[value] || value;
}

function display(value) {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "Not set";
  if (value === undefined || value === null || value === "") return "Not set";
  return String(value);
}

function rateRange(min, max) {
  if (typeof min !== "number" || typeof max !== "number") return null;
  return `S$${min} to S$${max} / hour`;
}

const detailRows = computed(() => {
  if (!profile.value) return [];
  const account = profile.value;
  const teaching = tutorProfile.value || {};
  const common = [
    ["Email address", account.email],
    ["Contact Number", account.phone],
    ["Location", isTutor.value ? teaching.location : account.location],
  ];

  const specific = isTutor.value
    ? [
        ["Subjects I Teach", teaching.subjects],
        ["Academic Background", teaching.qualification],
        [
          "Teaching Experience",
          typeof teaching.yearsOfExperience === "number"
            ? `${teaching.yearsOfExperience} ${teaching.yearsOfExperience === 1 ? "year" : "years"}`
            : null,
        ],
        ["Preferred Levels", (teaching.levels || []).map(levelLabel)],
        ["Preferred Hourly Rate", typeof teaching.hourlyRate === "number" ? `S$${teaching.hourlyRate} / hour` : null],
        ["Preferred Teaching Mode", teaching.lessonModes],
        ["Availability", teaching.availability],
        ["Teaching Styles", teaching.teachingStyles],
        ["About Me", teaching.bio],
      ]
    : [
        ["Preferred Subjects", account.subjects],
        ["Academic Level", account.level ? levelLabel(account.level) : null],
        ["Preferred Learning Mode", account.lessonModes],
        ["Preferred Hourly Rate", rateRange(account.budgetMin, account.budgetMax)],
        ["Availability", account.availability],
        ["Preferred Teaching Style", account.teachingStyles],
      ];

  return [...common, ...specific].map(([label, value]) => ({
    label,
    value: display(value),
  }));
});

const formValues = computed(() => {
  if (!profile.value) return {};
  const names = { firstName: profile.value.firstName, lastName: profile.value.lastName };
  if (isTutor.value) return { ...tutorProfile.value, ...names, phone: profile.value.phone };
  return { ...profile.value };
});

function startEditing() {
  saveError.value = "";
  saveMessage.value = "";
  isEditing.value = true;
}

function cancelEditing() {
  saveError.value = "";
  isEditing.value = false;
}

async function handleSave(values) {
  isSaving.value = true;
  saveError.value = "";
  try {
    await updateProfile(userId.value, profile.value, values, Boolean(tutorProfile.value));
    if (isTutor.value) {
      const { phone, firstName, lastName, ...teachingValues } = values;
      tutorProfile.value = { ...tutorProfile.value, ...teachingValues, firstName, lastName };
      profile.value = { ...profile.value, phone, firstName, lastName };
    } else {
      profile.value = { ...profile.value, ...values };
    }
    isEditing.value = false;
    saveMessage.value = "Your profile has been updated.";
  } catch (error) {
    console.error("Could not save profile:", error);
    saveError.value = "We could not save your changes. Please try again.";
  } finally {
    isSaving.value = false;
  }
}

onMounted(() => {
  unsubscribe = observeCurrentUser(async (user) => {
    const currentRequest = ++requestId;
    profile.value = null;
    tutorProfile.value = null;
    errorMessage.value = "";
    isSignedIn.value = Boolean(user);
    userId.value = user?.uid || "";
    isEditing.value = false;
    saveMessage.value = "";
    isLoading.value = true;

    if (!user) {
      isLoading.value = false;
      return;
    }

    try {
      const snapshot = await getDoc(doc(db, "users", user.uid));
      if (currentRequest !== requestId) return;
      if (!snapshot.exists()) {
        errorMessage.value = "Your profile could not be found.";
        return;
      }

      const account = snapshot.data();
      if (account.role === "tutor") {
        const teachingSnapshot = await getDoc(doc(db, "tutorProfiles", user.uid));
        if (currentRequest !== requestId) return;
        tutorProfile.value = teachingSnapshot.exists() ? teachingSnapshot.data() : null;
      }
      profile.value = account;
    } catch (error) {
      if (currentRequest !== requestId) return;
      console.error("Could not load profile:", error);
      errorMessage.value = "We could not load your profile. Please refresh and try again.";
    } finally {
      if (currentRequest === requestId) isLoading.value = false;
    }
  });
});

onUnmounted(() => {
  requestId++;
  unsubscribe?.();
});
</script>

<template>
  <div class="profile-page">
    <div class="page-shell">
      <AppNavBar :account="profile" />

      <main class="profile-card" aria-labelledby="profile-title">
        <h1 id="profile-title">My Profile</h1>
        <p class="subtitle">View and manage your account details.</p>

        <p v-if="isLoading" class="state-message" role="status">Loading your profile...</p>
        <p v-else-if="!isSignedIn" class="state-message">Please sign in to view your profile.</p>
        <p v-else-if="errorMessage" class="state-message error" role="alert">{{ errorMessage }}</p>

        <template v-else-if="profile">
          <div class="profile-summary">
            <div class="avatar" aria-hidden="true">{{ initials }}</div>
            <div class="identity">
              <h2>{{ fullName }}</h2>
              <p>{{ roleLabel }}</p>
            </div>
            <button v-if="!isEditing" class="edit-button" type="button" @click="startEditing">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m16 3 5 5-12 12-6 1 1-6L16 3Z" fill="currentColor" />
                <path d="m14 5 5 5" stroke="white" stroke-width="1.5" />
              </svg>
              Edit Profile
            </button>
          </div>

          <p v-if="saveMessage" class="save-message" role="status">{{ saveMessage }}</p>

          <div v-if="isEditing" class="edit-panel">
            <p class="email-note">Email address: {{ profile.email }} (cannot be changed)</p>
            <ProfileForm
              :role="profile.role"
              :initial-values="formValues"
              submit-label="Save Changes"
              :is-saving="isSaving"
              :save-error="saveError"
              show-cancel
              show-name
              @submit="handleSave"
              @cancel="cancelEditing"
            />
          </div>

          <dl v-else class="details-table">
            <div v-for="row in detailRows" :key="row.label" class="detail-row">
              <dt>{{ row.label }}</dt>
              <dd :class="{ unset: row.value === 'Not set' }">{{ row.value }}</dd>
            </div>
          </dl>
        </template>
      </main>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  padding: 24px;
  box-sizing: border-box;
  background: var(--page-background);
  color: #11143d;
  font-family: Arial, Helvetica, sans-serif;
}
.profile-page *, .profile-page *::before, .profile-page *::after { box-sizing: border-box; }
.page-shell { max-width: 1120px; margin: 0 auto; }
.profile-card { margin: 20px 16px 0; min-height: 650px; padding: 28px 24px 48px; background: rgba(255,255,255,.88); border: 1px solid #e1efeb; border-radius: 9px; }
h1 { margin: 0; font-size: 32px; line-height: 1.2; letter-spacing: -.9px; }
.subtitle { margin: 6px 0 26px; color: #616999; font-size: 15px; }
.profile-summary { display: flex; align-items: center; gap: 24px; margin: 0 8px 24px; }
.avatar { display: grid; place-items: center; flex-shrink: 0; width: 100px; height: 100px; border-radius: 50%; background: #e0f3eb; color: #007c5b; font-size: 34px; font-weight: 700; }
.identity { min-width: 0; }
h2 { margin: 0 0 6px; font-size: 24px; letter-spacing: -.6px; overflow-wrap: anywhere; }
.identity p { margin: 0; color: #616999; font-size: 15px; }
.edit-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; flex-shrink: 0; margin-left: auto; border: 1px solid #39ae86; border-radius: 5px; padding: 11px 18px; background: #fff; color: #00805d; font: inherit; font-size: 14px; font-weight: 600; }
.edit-button svg { width: 19px; height: 19px; }
.edit-button { cursor: pointer; }
.edit-button:hover { background: #f0faf6; }
.save-message { margin: 0 8px 20px; padding: 12px 16px; border: 1px solid #b7e4d2; border-radius: 6px; background: #e9f8f1; color: #00684b; font-size: 14px; font-weight: 600; }
.edit-panel { margin: 0 8px; }
.email-note { margin: 0 0 18px; color: #616999; font-size: 14px; }
button:focus-visible { outline: 3px solid #008563; outline-offset: 4px; }
.details-table { margin: 0; padding: 0 16px; border: 1px solid #e3e8f0; border-radius: 5px; background: #fff; }
.detail-row { display: grid; grid-template-columns: 44% minmax(0, 1fr); gap: 12px; padding: 15px 0; border-bottom: 1px solid #e7eaf3; font-size: 14px; line-height: 1.6; }
.detail-row:last-child { border-bottom: 0; }
dt { font-weight: 500; }
dd { margin: 0; color: #626a9b; overflow-wrap: anywhere; white-space: pre-line; }
.unset { color: #717887; }
.state-message { padding: 24px 0; color: #616999; }
.error { color: #b42318; }
a:focus-visible { outline: 3px solid #008563; outline-offset: 4px; }
@media (max-width: 700px) {
  .profile-page { padding: 12px; }
  .profile-card { margin: 12px 0 0; padding: 24px 18px; min-height: 0; }
  .profile-summary { margin: 0 0 24px; gap: 16px; flex-wrap: wrap; }
  .avatar { width: 76px; height: 76px; font-size: 28px; }
  h2 { font-size: 21px; }
  .identity { flex: 1; }
  .edit-button { margin-left: 0; }
  .detail-row { grid-template-columns: 1fr; gap: 4px; padding: 12px 0; }
  h1 { font-size: 28px; }
}
</style>
