<script setup>
defineProps({
  assignment: {
    type: Object,
    required: true,
  },
})

function displayValue(value) {
  return value || 'Not specified'
}

function formatPostedDate(timestamp) {
  if (!timestamp) {
    return 'Just posted'
  }

  const date =
    typeof timestamp.toDate === 'function'
      ? timestamp.toDate()
      : new Date(timestamp)

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable'
  }

  return new Intl.DateTimeFormat('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}
</script>

<template>
  <article class="assignment-card">
    <header class="card-header">
      <div>
        <h2>
          {{ assignment.level }} {{ assignment.subject }}
        </h2>

        <p class="location">
          {{ displayValue(assignment.location) }}
        </p>
      </div>

      <span class="status">
        {{ assignment.status }}
      </span>
    </header>

    <div class="assignment-details">
      <p class="detail">
        <span class="detail-label">
          Learning mode
        </span>

        {{ displayValue(assignment.learningMode) }}
      </p>

      <p class="detail">
        <span class="detail-label">
          Hourly budget
        </span>

        ${{ assignment.minimumRate }}–${{
          assignment.maximumRate
        }}/hour
      </p>

      <p class="detail">
        <span class="detail-label">
          Preferred day
        </span>

        {{ displayValue(assignment.preferredDay) }}
      </p>

      <p class="detail">
        <span class="detail-label">
          Preferred time
        </span>

        {{ displayValue(assignment.preferredTimeSlot) }}
      </p>

      <p class="detail">
        <span class="detail-label">
          Teaching style
        </span>

        {{ displayValue(assignment.teachingStyle) }}
      </p>

      <p class="detail">
        <span class="detail-label">
          Posted
        </span>

        {{ formatPostedDate(assignment.createdAt) }}
      </p>

      <p
        v-if="assignment.additionalDetails"
        class="detail additional-details"
      >
        <span class="detail-label">
          Additional details
        </span>

        {{ assignment.additionalDetails }}
      </p>
    </div>
  </article>
</template>

<style scoped>
.assignment-card {
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.card-header h2,
.card-header p {
  margin: 0;
}

.card-header h2 {
  font-size: 1.25rem;
}

.location {
  margin-top: 6px !important;
  color: var(--color-text-muted);
}

.status {
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: capitalize;
}

.assignment-details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 24px;
  margin-top: 24px;
}

.detail {
  margin: 0;
  color: var(--color-text);
}

.detail-label {
  display: block;
  margin-bottom: 4px;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-weight: 600;
}

.additional-details {
  grid-column: 1 / -1;
}

@media (max-width: 600px) {
  .card-header {
    flex-direction: column;
  }

  .assignment-details {
    grid-template-columns: 1fr;
  }

  .additional-details {
    grid-column: auto;
  }
}
</style>