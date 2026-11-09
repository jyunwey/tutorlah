<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import AppNavBar from "../components/AppNavBar.vue";
import ChatPanel from "../components/ChatPanel.vue";
import MatchList from "../components/MatchList.vue";
import MatchRequestList from "../components/MatchRequestList.vue";
import { useCurrentAccount } from "../composables/useCurrentAccount.js";
import {
  acceptMatchRequest,
  listenToAcceptedMatches,
  listenToIncomingRequests,
  rejectMatchRequest,
} from "../services/matches.js";
import { fetchAssignment } from "../services/assignments.js";
import {
  listenToMessages,
  markChatRead,
  sendChatMessage,
} from "../services/messages.js";
import {
  getFullName,
  getOtherUser,
  toDate,
} from "../utils/matchDisplay.js";

// My Matches (FR-021 to FR-024).
// Requests, All Matches and the chat all load from Firestore and update
// by themselves when the other person does something.

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
// Requests sent to me that I haven't answered, from Firestore (FR-022).
const requestDocs = ref([]);
const isLoadingRequests = ref(true);
const requestsError = ref("");
// The request being accepted or rejected, so its buttons can't be
// clicked twice.
const respondingId = ref(null);
const assignmentsById = ref({});

// Accepted matches from Firestore (FR-023).
const matchDocs = ref([]);
const isLoadingMatches = ref(true);
const matchesError = ref("");
// Messages in the open chat, from Firestore (FR-024).
const messages = ref([]);
const isLoadingMessages = ref(false);
const chatError = ref("");

const selectedId = ref(null);
const statusMessage = ref("");
const statusIsError = ref(false);

// FR-021: All Matches is open by default. The tab is kept in the URL
// (?tab=requests) so a refresh stays on the same tab.
const activeTab = computed(() =>
  route.query.tab === "requests" ? "requests" : "matches"
);

async function openTab(tab) {
  await router.replace({ query: tab === "requests" ? { tab } : {} });
}

async function handleTabKeydown(event) {
  const tabs = ["requests", "matches"];
  const currentIndex = tabs.indexOf(activeTab.value);
  let nextIndex;

  if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
  else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  else if (event.key === "Home") nextIndex = 0;
  else if (event.key === "End") nextIndex = tabs.length - 1;
  else return;

  event.preventDefault();
  const nextTab = tabs[nextIndex];
  await openTab(nextTab);
  await nextTick();
  document.getElementById(`tab-${nextTab}`)?.focus();
}

// Adds `otherUser` (name, role, ID) for the cards and chat to show.
function withOtherUser(match) {
  return { ...match, otherUser: getOtherUser(match, myId.value) };
}

function withLesson(match) {
  const assignment = assignmentsById.value[match.assignmentId];

  return {
    ...match,
    subject: match.subject ?? assignment?.subject ?? "",
    level: match.level ?? assignment?.level ?? "",
  };
}

watch([requestDocs, matchDocs], async ([requests, matches]) => {
  const docs = [...requests, ...matches];
  const missingIds = [
    ...new Set(
      docs
        .map((match) => match.assignmentId)
        .filter((id) => id && !(id in assignmentsById.value))
    ),
  ];

  if (missingIds.length === 0) {
    return;
  }

  const assignments = await Promise.all(
    missingIds.map((id) =>
      fetchAssignment(id).catch((error) => {
        console.error("Could not load assignment:", error);
        return null;
      })
    )
  );

  assignmentsById.value = {
    ...assignmentsById.value,
    ...Object.fromEntries(missingIds.map((id, index) => [id, assignments[index]])),
  };
});

// FR-022: newest request first.
const requests = computed(() =>
  [...requestDocs.value]
    .sort((a, b) => dateValue(b.createdAt) - dateValue(a.createdAt))
    .map(withOtherUser)
    .map(withLesson)
);

// FR-022: listen for requests sent to me. New requests appear, and
// answered ones disappear, without refreshing the page.
watch(
  myId,
  (userId, _previousId, onCleanup) => {
    requestDocs.value = [];
    requestsError.value = "";

    if (!userId) {
      return;
    }

    isLoadingRequests.value = true;

    const stopListening = listenToIncomingRequests(
      userId,
      (docs) => {
        requestDocs.value = docs;
        isLoadingRequests.value = false;
      },
      (error) => {
        console.error("Could not load requests:", error);
        requestsError.value =
          "We could not load your requests. Please refresh and try again.";
        isLoadingRequests.value = false;
      }
    );

    // Stops listening when the user changes or the page closes.
    onCleanup(stopListening);
  },
  { immediate: true }
);

// FR-023: most recent message first.
const sortedMatches = computed(() =>
  matchDocs.value
    .filter((match) => match.status === "accepted")
    .sort((a, b) => lastActivity(b) - lastActivity(a))
    .map(withLesson)
    .map(withOtherUser)
);

function lastActivity(match) {
  return dateValue(match.lastMessage?.sentAt ?? match.createdAt);
}

function dateValue(value) {
  return toDate(value)?.getTime() ?? 0;
}

// FR-023: listen for accepted matches involving the current user. Keep the
// existing selection when possible and show the first match on wide screens.
watch(
  [myId, account],
  ([userId, currentAccount], _previousValues, onCleanup) => {
    matchDocs.value = [];
    matchesError.value = "";

    const role = currentAccount?.role;

    if (
      !userId ||
      (role !== "student" && role !== "tutor")
    ) {
      isLoadingMatches.value = false;
      selectedId.value = null;
      return;
    }

    isLoadingMatches.value = true;

    const stopListening = listenToAcceptedMatches(
      userId,
      role,
      (docs) => {
        matchDocs.value = docs;
        isLoadingMatches.value = false;

        const selectedStillExists = docs.some(
          (match) => match.id === selectedId.value
        );

        if (selectedId.value && !selectedStillExists) {
          selectedId.value = null;
        }

        if (
          !selectedId.value &&
          window.matchMedia("(min-width: 761px)").matches
        ) {
          selectedId.value = sortedMatches.value[0]?.id ?? null;
        }
      },
      (error) => {
        console.error("Could not load matches:", error);
        matchesError.value =
          "We could not load your matches. Please refresh and try again.";
        isLoadingMatches.value = false;
      }
    );

    // Stops listening when the user or role changes, or the page closes.
    onCleanup(stopListening);
  },
  { immediate: true }
);

const selectedMatch = computed(
  () => sortedMatches.value.find((match) => match.id === selectedId.value) ?? null
);

// FR-024: listen to the open chat, so new messages from either person
// appear without refreshing.
watch(
  selectedId,
  (matchId, _previousId, onCleanup) => {
    messages.value = [];
    chatError.value = "";

    if (!matchId) {
      isLoadingMessages.value = false;
      return;
    }

    isLoadingMessages.value = true;

    const stopListening = listenToMessages(
      matchId,
      (docs) => {
        messages.value = docs;
        isLoadingMessages.value = false;
      },
      (error) => {
        console.error("Could not load messages:", error);
        chatError.value =
          "We could not load this chat. Please refresh and try again.";
        isLoadingMessages.value = false;
      }
    );

    // Stops listening when another chat opens or the page closes.
    onCleanup(stopListening);
  },
  { immediate: true }
);

function showStatus(message, isError = false) {
  statusMessage.value = message;
  statusIsError.value = isError;
}

// FR-022: Accept or Reject saves the answer in Firestore. The request then
// leaves this tab by itself, because the listener only shows pending ones.
async function respondToRequest(id, accept) {
  const request = requests.value.find((item) => item.id === id);

  if (!request || respondingId.value) {
    return;
  }

  const name = getFullName(request.otherUser);
  respondingId.value = id;
  showStatus("");

  try {
    if (accept) {
      await acceptMatchRequest(id, account.value);
      showStatus(`You matched with ${name}. You can now chat in All Matches.`);
    } else {
      await rejectMatchRequest(id);
      showStatus(`Request from ${name} rejected.`);
    }
  } catch (error) {
    console.error("Could not answer request:", error);
    showStatus(
      `We could not ${accept ? "accept" : "reject"} the request from ${name}. Please try again.`,
      true
    );
  } finally {
    respondingId.value = null;
  }
}

// FR-024: when the open chat has a new message from the other person,
// save that I've read it, so they see a double tick. Only counts while
// the chat is on screen: All Matches tab, chat open, browser tab visible.
let lastReadMessageId = null;

function markOpenChatRead() {
  const match = selectedMatch.value;

  if (
    !match ||
    activeTab.value !== "matches" ||
    document.visibilityState !== "visible"
  ) {
    return;
  }

  const newestFromThem = messages.value.findLast(
    (message) => message.senderId !== myId.value
  );

  if (!newestFromThem || newestFromThem.id === lastReadMessageId) {
    return;
  }

  const myReadAt = toDate(match.readAt?.[myId.value]);
  const messageSentAt = toDate(newestFromThem.sentAt);

  if (myReadAt && messageSentAt && myReadAt >= messageSentAt) {
    return;
  }

  // Remembered so the same message isn't saved as read twice.
  lastReadMessageId = newestFromThem.id;
  markChatRead(match.id).catch((error) => {
    console.error("Could not mark chat as read:", error);
  });
}

watch([selectedId, messages, activeTab], markOpenChatRead);

onMounted(() => {
  document.addEventListener("visibilitychange", markOpenChatRead);
});

onUnmounted(() => {
  document.removeEventListener("visibilitychange", markOpenChatRead);
});

// FR-024: save the message. It shows straight away, and the list
// preview updates once Firestore has it.
async function sendMessage(text, restoreDraft) {
  const matchId = selectedId.value;

  if (!matchId) {
    return;
  }

  chatError.value = "";

  try {
    await sendChatMessage(matchId, text);
  } catch (error) {
    console.error("Could not send message:", error);

    // Only put the text back if the same chat is still open.
    if (selectedId.value === matchId) {
      restoreDraft();
      chatError.value = "We could not send your message. Please try again.";
    } else {
      showStatus("A message could not be sent. Please try again.", true);
    }
  }
}

// Clear the status message when switching tabs.
watch(activeTab, () => {
  showStatus("");
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
            :tabindex="activeTab === 'requests' ? 0 : -1"
            aria-controls="panel-requests"
            @click="openTab('requests')"
            @keydown="handleTabKeydown"
          >
            Requests{{ isLoadingRequests ? "" : ` (${requests.length})` }}
          </button>
          <button
            id="tab-matches"
            type="button"
            role="tab"
            class="tab"
            :class="{ active: activeTab === 'matches' }"
            :aria-selected="activeTab === 'matches'"
            :tabindex="activeTab === 'matches' ? 0 : -1"
            aria-controls="panel-matches"
            @click="openTab('matches')"
            @keydown="handleTabKeydown"
          >
            All Matches ({{ sortedMatches.length }})
          </button>
        </div>

        <p
          v-if="statusMessage"
          class="status-message"
          :class="{ error: statusIsError }"
          :role="statusIsError ? 'alert' : 'status'"
        >
          {{ statusMessage }}
        </p>

        <div
          v-if="activeTab === 'requests'"
          id="panel-requests"
          role="tabpanel"
          aria-labelledby="tab-requests"
        >
          <p v-if="isLoadingRequests" class="status">Loading requests...</p>

          <p v-else-if="requestsError" class="status error" role="alert">
            {{ requestsError }}
          </p>

          <MatchRequestList
            v-else
            :requests="requests"
            :viewer-role="account?.role"
            :responding-id="respondingId"
            @accept="respondToRequest($event, true)"
            @reject="respondToRequest($event, false)"
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
          <p v-if="isLoadingMatches" class="status">Loading matches...</p>

          <p v-else-if="matchesError" class="status error" role="alert">
            {{ matchesError }}
          </p>

          <template v-else>
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
              :messages="messages"
              :is-loading="isLoadingMessages"
              :error-message="chatError"
              @send="sendMessage"
              @back="selectedId = null"
            />
          </template>
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
  background: var(--page-background);
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

.status-message.error {
  background: #fdecea;
  color: var(--color-error);
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
