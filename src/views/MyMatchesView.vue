<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import AppNavBar from "../components/AppNavBar.vue";
import ChatPanel from "../components/ChatPanel.vue";
import MatchList from "../components/MatchList.vue";
import MatchRequestList from "../components/MatchRequestList.vue";
import { useCurrentAccount } from "../composables/useCurrentAccount.js";
import { createSampleData } from "../constants/sampleMatches.js";
import {
  getFullName,
  getOtherUser,
  toDate,
} from "../utils/matchDisplay.js";

// My Matches (FR-021 to FR-024).
// SKELETON: uses temporary sample data. Accept, Reject and Send only
// change what's on screen; nothing is saved yet. The next step loads
// and saves the `matches` collection in Firestore instead.

const route = useRoute();
const router = useRouter();

const {
  user,
  account,
  isLoading: isAccountLoading,
  errorMessage: accountErrorMessage,
} = useCurrentAccount();

const myId = computed(() => user.value?.uid ?? "");

// `matches` documents (docs/data-model.md): one per request,
// "pending" -> "accepted" or "rejected".
const matchDocs = ref([]);
// Messages for each match, keyed by match ID.
const messagesByMatch = ref({});

const selectedId = ref(null);
const statusMessage = ref("");

// FR-021: All Matches is open by default. The tab is kept in the URL
// (?tab=requests) so a refresh stays on the same tab.
const activeTab = computed(() =>
  route.query.tab === "requests" ? "requests" : "matches"
);

function openTab(tab) {
  router.replace({ query: tab === "requests" ? { tab } : {} });
}

// Adds `otherUser` (name, role, ID) for the cards and chat to show.
function withOtherUser(match) {
  return { ...match, otherUser: getOtherUser(match, myId.value) };
}

// FR-022: only requests sent to me that I haven't answered.
const requests = computed(() =>
  matchDocs.value
    .filter(
      (match) => match.status === "pending" && match.recipientId === myId.value
    )
    .sort((a, b) => toDate(b.createdAt) - toDate(a.createdAt))
    .map(withOtherUser)
);

// FR-023: most recent message first.
const sortedMatches = computed(() =>
  matchDocs.value
    .filter((match) => match.status === "accepted")
    .sort((a, b) => lastActivity(b) - lastActivity(a))
    .map(withOtherUser)
);

function lastActivity(match) {
  return toDate(match.lastMessage?.sentAt ?? match.createdAt);
}

const selectedMatch = computed(
  () => sortedMatches.value.find((match) => match.id === selectedId.value) ?? null
);

const selectedMessages = computed(
  () => messagesByMatch.value[selectedId.value] ?? []
);

watch(account, (currentAccount) => {
  if (!currentAccount) {
    return;
  }

  const sample = createSampleData(currentAccount, myId.value);
  matchDocs.value = sample.matches;
  messagesByMatch.value = sample.messagesByMatch;

  // Wide screens show the first chat straight away, like the prototype.
  // Phones start on the list.
  if (window.matchMedia("(min-width: 761px)").matches) {
    selectedId.value = sortedMatches.value[0]?.id ?? null;
  }
});

function findMatch(id) {
  return matchDocs.value.find((match) => match.id === id);
}

// FR-022: Accept moves the request to All Matches.
function acceptRequest(id) {
  const match = findMatch(id);
  match.status = "accepted";

  // A tutor applying to an assignment (FR-016) can't see the student's
  // name, so the student adds it when accepting (docs/data-model.md).
  if (account.value.role === "student") {
    match.studentFirstName = account.value.firstName;
    match.studentLastName = account.value.lastName;
  }

  messagesByMatch.value[id] = [];
  statusMessage.value = `You matched with ${getFullName(getOtherUser(match, myId.value))}. You can now chat in All Matches.`;
}

// FR-022: Reject removes the request.
function rejectRequest(id) {
  const match = findMatch(id);
  match.status = "rejected";
  statusMessage.value = `Request from ${getFullName(getOtherUser(match, myId.value))} rejected.`;
}

// FR-024: add the message and update the list preview.
function sendMessage(text) {
  const match = findMatch(selectedId.value);
  const message = {
    id: `local-${Date.now()}`,
    senderId: myId.value,
    text,
    sentAt: new Date(),
  };

  messagesByMatch.value[match.id] = [...selectedMessages.value, message];
  match.lastMessage = {
    text,
    senderId: myId.value,
    sentAt: message.sentAt,
  };
}

// Clear the status message when switching tabs.
watch(activeTab, () => {
  statusMessage.value = "";
});
</script>

<template>
  <main class="my-matches-page">
    <!-- FR-005 -->
    <div class="nav-wrapper">
      <AppNavBar :account="account" />
    </div>

    <div class="container">
      <header class="page-header">
        <h1>My Matches</h1>
        <p>
          Manage your matches and chat with your
          {{ account?.role === "tutor" ? "students" : "tutors" }}
          all in one place.
        </p>
      </header>

      <p v-if="isAccountLoading" class="status">Loading your matches...</p>

      <p v-else-if="accountErrorMessage" class="status error">
        {{ accountErrorMessage }}
      </p>

      <template v-else>
        <!-- FR-021 -->
        <div class="tabs" role="tablist" aria-label="My Matches">
          <button
            id="tab-requests"
            type="button"
            role="tab"
            class="tab"
            :class="{ active: activeTab === 'requests' }"
            :aria-selected="activeTab === 'requests'"
            aria-controls="panel-requests"
            @click="openTab('requests')"
          >
            Requests ({{ requests.length }})
          </button>
          <button
            id="tab-matches"
            type="button"
            role="tab"
            class="tab"
            :class="{ active: activeTab === 'matches' }"
            :aria-selected="activeTab === 'matches'"
            aria-controls="panel-matches"
            @click="openTab('matches')"
          >
            All Matches ({{ sortedMatches.length }})
          </button>
        </div>

        <p v-if="statusMessage" class="status-message" role="status">
          {{ statusMessage }}
        </p>

        <div
          v-if="activeTab === 'requests'"
          id="panel-requests"
          role="tabpanel"
          aria-labelledby="tab-requests"
        >
          <MatchRequestList
            :requests="requests"
            :viewer-role="account?.role"
            @accept="acceptRequest"
            @reject="rejectRequest"
          />
        </div>

        <div
          v-else
          id="panel-matches"
          class="matches-layout"
          :class="{ 'chat-open': selectedMatch }"
          role="tabpanel"
          aria-labelledby="tab-matches"
        >
          <MatchList
            class="list-panel"
            :matches="sortedMatches"
            :selected-id="selectedId"
            :my-id="myId"
            @select="selectedId = $event"
          />
          <ChatPanel
            class="chat-panel"
            :match="selectedMatch"
            :messages="selectedMessages"
            @send="sendMessage"
            @back="selectedId = null"
          />
        </div>
      </template>
    </div>
  </main>
</template>

<style scoped>
.my-matches-page {
  min-height: 100vh;
  padding: 24px 20px 32px;
  box-sizing: border-box;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
}

.nav-wrapper {
  max-width: 1200px;
  margin: 0 auto 28px;
}

.container {
  display: grid;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header h1,
.page-header p {
  margin: 0;
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.page-header p {
  margin-top: 8px;
  color: var(--color-text-muted);
  font-size: 1.15rem;
}

.tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 4px;
  border-radius: var(--radius-card);
  background: var(--color-surface-muted);
}

.tab {
  padding: 12px;
  border: none;
  border-bottom: 3px solid transparent;
  border-radius: var(--radius-control);
  background: none;
  color: var(--color-text-muted);
  font: inherit;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
}

.tab.active {
  border-bottom-color: var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.tab:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.status-message {
  margin: 0;
  padding: 12px 16px;
  border-radius: var(--radius-control);
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  font-weight: 500;
}

/* All Matches: list on the left, chat on the right. */
.matches-layout {
  display: grid;
  grid-template-columns: minmax(280px, 380px) 1fr;
  gap: 16px;
  height: min(640px, calc(100vh - 200px));
  min-height: 440px;
}

/* Loading and error messages. */
.status {
  margin: 0;
  padding: 48px 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  color: var(--color-text-muted);
  text-align: center;
}

.error {
  color: var(--color-error);
}

/* Phones: show either the list or the open chat. */
@media (max-width: 760px) {
  .page-header h1 {
    font-size: 2rem;
  }

  .matches-layout {
    grid-template-columns: 1fr;
    height: calc(100vh - 160px);
  }

  .matches-layout:not(.chat-open) .chat-panel,
  .matches-layout.chat-open .list-panel {
    display: none;
  }
}
</style>
