<script setup>
import { computed, ref } from "vue";

import InitialsAvatar from "./InitialsAvatar.vue";
import {
  formatListTime,
  getFullName,
  getRoleLabel,
} from "../utils/matchDisplay.js";

// FR-023: accepted matches, most recent message first, searchable by name.
// No online status (Refined FR-023).
const props = defineProps({
  // Already sorted by MyMatchesView.
  matches: {
    type: Array,
    required: true,
  },
  selectedId: {
    type: String,
    default: null,
  },
  myId: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["select"]);

const search = ref("");

const visibleMatches = computed(() => {
  const term = search.value.trim().toLowerCase();

  if (!term) {
    return props.matches;
  }

  return props.matches.filter((match) =>
    getFullName(match.otherUser).toLowerCase().includes(term)
  );
});

function previewText(match) {
  if (!match.lastMessage) {
    return "No messages yet. Say hello!";
  }

  const prefix = match.lastMessage.senderId === props.myId ? "You: " : "";
  return prefix + match.lastMessage.text;
}

function matchContextLabel(match) {
  const lesson = [match.level, match.subject]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean)
    .join(" ");

  return lesson || getRoleLabel(match.otherUser.role);
}
</script>

<template>
  <section class="match-list-card" aria-labelledby="matches-heading">
    <header class="card-header">
      <h2 id="matches-heading">All Matches</h2>

      <label class="search">
        <span class="visually-hidden">Search matches by name</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input v-model="search" type="search" placeholder="Search matches..." />
      </label>
    </header>

    <p v-if="matches.length === 0" class="empty">
      No matches yet. Accepted requests will appear here.
    </p>

    <p v-else-if="visibleMatches.length === 0" class="empty">
      No matches found for "{{ search.trim() }}".
    </p>

    <ul v-else class="match-list">
      <li v-for="match in visibleMatches" :key="match.id">
        <button
          type="button"
          class="match-row"
          :class="{ selected: match.id === selectedId }"
          :aria-current="match.id === selectedId ? 'true' : undefined"
          @click="emit('select', match.id)"
        >
          <InitialsAvatar :person="match.otherUser" :size="52" />

          <span class="details">
            <span class="top-line">
              <span class="name">{{ getFullName(match.otherUser) }}</span>
              <span class="time">
                {{ formatListTime(match.lastMessage?.sentAt ?? match.createdAt) }}
              </span>
            </span>
            <span class="role">{{ matchContextLabel(match) }}</span>
            <span class="preview">{{ previewText(match) }}</span>
          </span>
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.match-list-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.card-header {
  display: grid;
  gap: 12px;
  padding: 18px 16px 14px;
  border-bottom: 1px solid var(--color-border);
}

.card-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  color: var(--color-text-muted);
}

.search:focus-within {
  border-color: var(--color-primary);
}

.search svg {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
}

.search input {
  flex: 1;
  min-width: 0;
  padding: 10px 0;
  border: none;
  outline: none;
  background: none;
  color: var(--color-text);
  font: inherit;
}

.empty {
  margin: 0;
  padding: 40px 20px;
  color: var(--color-text-muted);
  text-align: center;
}

.match-list {
  flex: 1;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.match-list li + li {
  border-top: 1px solid var(--color-border);
}

.match-row {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 16px;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.match-row:hover {
  background: var(--color-surface-muted);
}

.match-row.selected {
  background: var(--color-primary-light);
}

/* Keeps the avatar visible on the green selected row. */
.match-row.selected .avatar {
  background: var(--color-surface);
}

.match-row:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.details {
  display: grid;
  flex: 1;
  min-width: 0;
  gap: 2px;
}

.top-line {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.name {
  font-weight: 700;
}

.time {
  flex-shrink: 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.role,
.preview {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.role {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* One line, cut off with "..." */
.preview {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
