<script setup>
import { computed, nextTick, ref, watch } from "vue";

import InitialsAvatar from "./InitialsAvatar.vue";
import {
  formatTime,
  getFullName,
  getRoleLabel,
  toDate,
} from "../utils/matchDisplay.js";

// FR-024: text messages between two matched users. The send button is
// disabled while the box is empty. No attachments, no online status.
const props = defineProps({
  // null when no match is selected.
  match: {
    type: Object,
    default: null,
  },
  messages: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  // Shown above the message box when the chat can't load or a message
  // can't be sent.
  errorMessage: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["send", "back"]);

const draft = ref("");
const messageList = ref(null);

const canSend = computed(() => draft.value.trim() !== "");

// It's a two-person chat, so anything the other person didn't send is mine.
function isMine(message) {
  return message.senderId !== props.match.otherUser.id;
}

// FR-024: my messages show a clock while saving, one tick once sent, and
// two ticks once the other person has opened the chat after it arrived.
const TICK_LABELS = {
  sending: "Sending",
  sent: "Sent",
  read: "Read",
};

function getTickStatus(message) {
  if (message.isPending) {
    return "sending";
  }

  const theirReadAt = toDate(props.match.readAt?.[props.match.otherUser.id]);
  const sentAt = toDate(message.sentAt);

  return theirReadAt && sentAt && theirReadAt >= sentAt ? "read" : "sent";
}

const messageRows = computed(() =>
  props.messages.map((message) => {
    const mine = isMine(message);
    return { ...message, mine, tickStatus: mine ? getTickStatus(message) : null };
  })
);

// The box clears straight away. If the message can't be sent,
// MyMatchesView calls the second argument to put the text back.
function send() {
  if (!canSend.value) {
    return;
  }

  const text = draft.value.trim();
  draft.value = "";
  emit("send", text, () => {
    if (draft.value === "") {
      draft.value = text;
    }
  });
}

// Show the newest message when a chat opens or a message arrives.
watch(
  () => [props.match?.id, props.messages.length],
  async () => {
    await nextTick();
    if (messageList.value) {
      messageList.value.scrollTop = messageList.value.scrollHeight;
    }
  },
  { immediate: true }
);

// Start with an empty box when switching chats.
watch(
  () => props.match?.id,
  () => {
    draft.value = "";
  }
);
</script>

<template>
  <section class="chat-card" :aria-label="match ? `Chat with ${getFullName(match.otherUser)}` : 'Chat'">
    <p v-if="!match" class="empty">
      Select a match to start chatting.
    </p>

    <template v-else>
      <header class="chat-header">
        <!-- Phones only: back to the match list. -->
        <button
          type="button"
          class="back-button"
          aria-label="Back to all matches"
          @click="emit('back')"
        >
          ‹
        </button>

        <InitialsAvatar :person="match.otherUser" :size="48" />

        <div>
          <h2>{{ getFullName(match.otherUser) }}</h2>
          <p>{{ getRoleLabel(match.otherUser.role) }}</p>
        </div>
      </header>

      <ol ref="messageList" class="message-list" aria-live="polite">
        <li v-if="isLoading" class="no-messages">Loading messages...</li>

        <li v-else-if="messages.length === 0" class="no-messages">
          You're matched! Send a message to get started.
        </li>

        <li
          v-for="message in messageRows"
          :key="message.id"
          class="message"
          :class="message.mine ? 'mine' : 'theirs'"
        >
          <InitialsAvatar
            v-if="!message.mine"
            :person="match.otherUser"
            :size="36"
          />
          <div class="bubble-group">
            <p class="bubble">{{ message.text }}</p>
            <p class="time">
              {{ formatTime(message.sentAt) }}
              <span
                v-if="message.mine"
                class="ticks"
                :class="message.tickStatus"
                :title="TICK_LABELS[message.tickStatus]"
              >
                <svg
                  v-if="message.tickStatus === 'sending'"
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                >
                  <circle cx="8" cy="8" r="5.5" />
                  <path d="M8 5v3.2l2 1.3" />
                </svg>
                <svg v-else viewBox="0 0 20 16" aria-hidden="true">
                  <path d="M1.5 8.5 5 12l6.5-7.5" />
                  <path
                    v-if="message.tickStatus === 'read'"
                    d="m8 11 1 1 6.5-7.5"
                  />
                </svg>
                <span class="visually-hidden">
                  {{ TICK_LABELS[message.tickStatus] }}
                </span>
              </span>
            </p>
          </div>
        </li>
      </ol>

      <p v-if="errorMessage" class="chat-error" role="alert">
        {{ errorMessage }}
      </p>

      <form class="composer" @submit.prevent="send">
        <label class="visually-hidden" for="chat-message">Message</label>
        <input
          id="chat-message"
          v-model="draft"
          type="text"
          placeholder="Type a message..."
          autocomplete="off"
          maxlength="1000"
        />
        <button
          type="submit"
          class="send-button"
          :disabled="!canSend"
          aria-label="Send message"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M22 2 11 13" />
            <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
          </svg>
        </button>
      </form>
    </template>
  </section>
</template>

<style scoped>
.chat-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.empty {
  display: grid;
  flex: 1;
  place-items: center;
  margin: 0;
  padding: 40px 20px;
  color: var(--color-text-muted);
  text-align: center;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--color-border);
}

.chat-header h2,
.chat-header p {
  margin: 0;
}

.chat-header h2 {
  font-size: 1.15rem;
}

.chat-header p {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.back-button {
  display: none;
  padding: 0 6px;
  border: none;
  background: none;
  color: var(--color-text);
  font: inherit;
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
}

.message-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14px;
  margin: 0;
  padding: 20px 18px;
  overflow-y: auto;
  list-style: none;
}

.no-messages {
  margin: auto;
  color: var(--color-text-muted);
  text-align: center;
}

.message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 75%;
}

.message.mine {
  align-self: flex-end;
}

.bubble-group {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.mine .bubble-group {
  justify-items: end;
}

.bubble {
  margin: 0;
  padding: 10px 14px;
  border-radius: 12px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.theirs .bubble {
  background: var(--color-surface-muted);
}

.mine .bubble {
  background: var(--color-primary-light);
}

.time {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.ticks {
  display: inline-flex;
}

.ticks svg {
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ticks.sending svg {
  width: 14px;
}

.ticks.sent svg,
.ticks.read svg {
  width: 18px;
}

/* Read: two green ticks, like the prototype. */
.ticks.read {
  color: var(--color-primary);
}

.chat-error {
  margin: 0;
  padding: 10px 18px;
  background: #fdecea;
  color: var(--color-error);
  font-size: 0.95rem;
}

.composer {
  display: flex;
  gap: 10px;
  padding: 14px 18px;
  border-top: 1px solid var(--color-border);
}

.composer input {
  flex: 1;
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  color: var(--color-text);
  font: inherit;
}

.composer input:focus {
  border-color: var(--color-primary);
  outline: none;
}

.send-button {
  display: grid;
  place-items: center;
  width: 52px;
  border: none;
  border-radius: var(--radius-control);
  background: var(--color-primary);
  color: white;
  cursor: pointer;
}

.send-button svg {
  width: 20px;
  height: 20px;
}

.send-button:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.send-button:disabled {
  background: var(--color-ring-track);
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.back-button:focus-visible,
.send-button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (max-width: 760px) {
  .back-button {
    display: block;
  }

  .message {
    max-width: 88%;
  }
}
</style>
