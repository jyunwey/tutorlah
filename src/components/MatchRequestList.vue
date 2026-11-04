<script setup>
import { RouterLink } from "vue-router";

import InitialsAvatar from "./InitialsAvatar.vue";
import {
  formatDate,
  getFullName,
  getRoleLabel,
} from "../utils/matchDisplay.js";

// FR-022: the recipient sees each request and can open the sender's
// profile. Accept moves it to All Matches; Reject removes it.
defineProps({
  requests: {
    type: Array,
    required: true,
  },
  viewerRole: {
    type: String,
    default: "student",
  },
  // The request being saved. All buttons wait until it finishes.
  respondingId: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["accept", "reject"]);
</script>

<template>
  <section class="requests-card" aria-labelledby="requests-heading">
    <header class="card-header">
      <h2 id="requests-heading">Incoming Requests</h2>
      <p>
        Review and respond to requests from
        {{ viewerRole === "tutor" ? "students and parents" : "tutors" }}.
      </p>
    </header>

    <p v-if="requests.length === 0" class="empty">
      No requests right now. New requests will appear here.
    </p>

    <ul v-else class="request-list">
      <li v-for="request in requests" :key="request.id" class="request-row">
        <InitialsAvatar :person="request.otherUser" :size="64" />

        <div class="details">
          <p class="name">{{ getFullName(request.otherUser) }}</p>
          <p class="role">{{ getRoleLabel(request.otherUser.role) }}</p>
          <p class="note">
            {{
              request.otherUser.role === "tutor"
                ? "Has requested to tutor you."
                : "Has asked you to be their tutor."
            }}
          </p>
        </div>

        <p class="date">{{ formatDate(request.createdAt) }}</p>

        <div class="actions" :aria-busy="respondingId === request.id">
          <button
            type="button"
            class="accept-button"
            :disabled="respondingId !== null"
            @click="emit('accept', request.id)"
          >
            <span aria-hidden="true">✓</span> Accept
          </button>
          <button
            type="button"
            class="reject-button"
            :disabled="respondingId !== null"
            @click="emit('reject', request.id)"
          >
            <span aria-hidden="true">✕</span> Reject
          </button>
        </div>

        <!-- FR-022: open the tutor's profile. There is no public page
             for students yet, so this only shows for tutors. -->
        <RouterLink
          v-if="request.otherUser.role === 'tutor'"
          :to="{ name: 'tutor-profile', params: { id: request.otherUser.id } }"
          class="profile-link"
          :aria-label="`View ${getFullName(request.otherUser)}'s profile`"
        >
          ›
        </RouterLink>
        <span v-else class="profile-link-spacer" aria-hidden="true"></span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.requests-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.card-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
}

.card-header h2,
.card-header p {
  margin: 0;
}

.card-header h2 {
  font-size: 1.25rem;
}

.card-header p {
  margin-top: 4px;
  color: var(--color-text-muted);
}

.empty {
  margin: 0;
  padding: 48px 24px;
  color: var(--color-text-muted);
  text-align: center;
}

.request-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.request-row {
  display: grid;
  grid-template-columns: auto 1fr auto auto 32px;
  align-items: center;
  gap: 20px;
  padding: 16px 24px;
}

.request-row + .request-row {
  border-top: 1px solid var(--color-border);
}

.details p,
.date {
  margin: 0;
}

.name {
  font-weight: 700;
}

.role,
.note,
.date {
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.actions {
  display: grid;
  gap: 8px;
  width: 140px;
}

.accept-button,
.reject-button {
  padding: 9px 14px;
  border: none;
  border-radius: var(--radius-control);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.accept-button {
  background: var(--color-primary);
  color: white;
}

.accept-button:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.reject-button {
  background: #fdecea;
  color: var(--color-error);
}

.reject-button:hover:not(:disabled) {
  background: #f9d6d2;
}

.accept-button:disabled,
.reject-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.profile-link {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: var(--color-text);
  font-size: 1.75rem;
  text-decoration: none;
}

.profile-link:hover {
  background: var(--color-surface-muted);
}

.accept-button:focus-visible,
.reject-button:focus-visible,
.profile-link:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Phones: buttons go under the name, side by side. */
@media (max-width: 640px) {
  .request-row {
    grid-template-columns: auto 1fr 32px;
    gap: 12px 16px;
    padding: 16px;
  }

  .date {
    grid-column: 2;
    grid-row: 2;
  }

  .actions {
    grid-column: 1 / -1;
    grid-template-columns: 1fr 1fr;
    width: auto;
  }

  .profile-link,
  .profile-link-spacer {
    grid-column: 3;
    grid-row: 1;
  }
}
</style>
