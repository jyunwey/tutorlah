<script setup>
import { ref } from "vue";
import { RouterLink } from "vue-router";

import InitialsAvatar from "./InitialsAvatar.vue";
import {
  formatDate,
  formatTime,
  getFullName,
  getLessonLabel,
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

const expandedRequestId = ref(null);

function toggleRequestDetails(requestId) {
  expandedRequestId.value = expandedRequestId.value === requestId
    ? null
    : requestId;
}

function receivedLabel(request) {
  return [formatDate(request.createdAt), formatTime(request.createdAt)]
    .filter(Boolean)
    .join(" · ") || "Not available";
}
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
      No requests yet. New requests will appear here.
    </p>

    <ul v-else class="request-list">
      <li v-for="request in requests" :key="request.id" class="request-row">
        <InitialsAvatar :person="request.otherUser" :size="64" />

        <div class="details">
          <p class="name">{{ getFullName(request.otherUser) }}</p>
          <p class="role">{{ getRoleLabel(request.otherUser.role) }}</p>
          <p v-if="getLessonLabel(request)" class="lesson">
            {{ getLessonLabel(request) }}
          </p>
          <p class="note">
            {{
              request.otherUser.role === "tutor"
                ? "Has requested to tutor you."
                : "Has asked you to be their tutor."
            }}
          </p>
        </div>

        <p class="date">
          {{ receivedLabel(request) }}
        </p>

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

        <!-- FR-022: tutor senders have a public profile. Student/Parent
             senders use a privacy-safe details panel based only on fields
             already copied onto this request. -->
        <RouterLink
          v-if="request.otherUser.role === 'tutor'"
          :to="{ name: 'tutor-profile', params: { id: request.otherUser.id } }"
          class="profile-link"
          :aria-label="`View ${getFullName(request.otherUser)}'s profile`"
        >
          ›
        </RouterLink>
        <button
          v-else
          type="button"
          class="profile-link"
          :aria-label="`View request details for ${getFullName(request.otherUser)}`"
          :aria-expanded="expandedRequestId === request.id"
          :aria-controls="`request-details-${request.id}`"
          @click="toggleRequestDetails(request.id)"
        >
          ›
        </button>

        <div
          v-if="expandedRequestId === request.id"
          :id="`request-details-${request.id}`"
          class="request-details"
        >
          <h3>Request details</h3>
          <dl>
            <div>
              <dt>Requester</dt>
              <dd>{{ getFullName(request.otherUser) }}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{{ getRoleLabel(request.otherUser.role) }}</dd>
            </div>
            <div v-if="getLessonLabel(request)">
              <dt>Learning request</dt>
              <dd>{{ getLessonLabel(request) }}</dd>
            </div>
            <div>
              <dt>Received</dt>
              <dd>{{ receivedLabel(request) }}</dd>
            </div>
          </dl>
        </div>
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

.lesson {
  color: var(--color-primary);
  font-size: 0.95rem;
  font-weight: 600;
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
  border: 0;
  background: transparent;
  cursor: pointer;
}

.profile-link:hover {
  background: var(--color-surface-muted);
}

.request-details {
  grid-column: 2 / -1;
  padding: 14px 16px;
  border-radius: var(--radius-control);
  background: var(--color-surface-muted);
}

.request-details h3 {
  margin: 0 0 10px;
  font-size: 1rem;
}

.request-details dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 20px;
  margin: 0;
}

.request-details dt,
.request-details dd {
  margin: 0;
}

.request-details dt {
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.request-details dd {
  margin-top: 2px;
  font-weight: 600;
}

.accept-button:focus-visible,
.reject-button:focus-visible,
.profile-link:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Phones: buttons go under the name, side by side. A smaller avatar
   leaves more room for the name and subject. */
@media (max-width: 640px) {
  .request-row {
    grid-template-columns: auto 1fr 32px;
    gap: 12px;
    padding: 16px;
  }

  .request-row .avatar {
    width: 48px;
    height: 48px;
    font-size: 17px;
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

  .profile-link {
    grid-column: 3;
    grid-row: 1;
  }

  .request-details {
    grid-column: 1 / -1;
  }

  .request-details dl {
    grid-template-columns: 1fr;
  }
}
</style>
