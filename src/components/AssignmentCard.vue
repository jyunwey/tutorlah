<script setup>
import MatchRing from './MatchRing.vue'
import {
  TIME_SLOTS,
} from '../constants/assignmentFilters.js'

const props = defineProps({
  assignment: {
    type: Object,
    required: true,
  },

  compatibility: {
    type: Number,
    default: null,
  },

  // FR-021: Application button state
  applied: {
    type: Boolean,
    default: false,
  },

  // FR-022: the student rejected my application.
  rejected: {
    type: Boolean,
    default: false,
  },

  isApplying: {
    type: Boolean,
    default: false,
  },

  disabled: {
    type: Boolean,
    default: false,
  },

  showApply: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['apply'])

function handleApply() {
  emit('apply', props.assignment)
} 

function displayValue(value) {
  return value || 'Not specified'
}

function formatTimeSlot(value) {
  const timeSlot = TIME_SLOTS.find(
    (option) => option.value === value
  )

  return timeSlot?.label
    ?? displayValue(value)
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
    <div class="card-content">
      <header class="card-header">
        <div>
          <h2>
            {{ assignment.level }}
            {{ assignment.subject }}
          </h2>

          <p class="location">
            {{ displayValue(assignment.location) }}
          </p>
        </div>

      </header>

      <div class="main-details">
        <span class="detail-pill">
          {{ displayValue(assignment.learningMode) }}
        </span>

        <span class="budget">
          ${{ assignment.minimumRate }}–${{
            assignment.maximumRate
          }}/hour
        </span>
      </div>

      <dl class="assignment-details">
        <div>
          <dt>Preferred day</dt>

          <dd>
            {{
              displayValue(
                assignment.preferredDay
              )
            }}
          </dd>
        </div>

        <div>
          <dt>Preferred time</dt>

          <dd>
            {{
              formatTimeSlot(
                assignment.preferredTimeSlot
              )
            }}
          </dd>
        </div>

        <div>
          <dt>Posted</dt>

          <dd>
            {{
              formatPostedDate(
                assignment.createdAt
              )
            }}
          </dd>
        </div>
      </dl>

      <div
        v-if="
          assignment.teachingStyle &&
          assignment.teachingStyle
            !== 'No preference'
        "
        class="teaching-style"
      >
        <span>Preferred teaching style</span>

        <strong>
          {{ assignment.teachingStyle }}
        </strong>
      </div>

      <p
        v-if="assignment.additionalDetails"
        class="additional-details"
      >
        {{ assignment.additionalDetails }}
      </p>
    </div>

    <div class="match-section">
    
      <MatchRing
        :value="compatibility"
        :size="82"
      />

      <!-- FR-021: Apply for assignment -->
      <button
        v-if="showApply"
        type="button"
        class="apply-btn"
        :class="{ rejected }"
        :disabled="applied || rejected || isApplying || disabled"
        @click.stop="handleApply"
      >
        {{
          rejected
            ? 'Rejected'
            : applied
              ? 'Applied'
              : isApplying
                ? 'Applying...'
                : 'Apply'
        }}
      </button>
    </div>
  </article>
</template>

<style scoped>
.assignment-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px;
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  transition:
    transform 150ms ease,
    box-shadow 150ms ease;
}

.assignment-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
}

.card-content {
  min-width: 0;
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

.main-details {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 18px;
  margin-top: 18px;
}

.detail-pill {
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--color-surface-muted);
  font-size: 0.9rem;
  font-weight: 600;
}

.budget {
  color: var(--color-primary);
  font-weight: 700;
}

.assignment-details {
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin: 22px 0 0;
}

.assignment-details div {
  min-width: 0;
}

.assignment-details dt {
  color: var(--color-text-muted);
  font-size: 0.8rem;
  font-weight: 600;
}

.assignment-details dd {
  margin: 5px 0 0;
  overflow-wrap: anywhere;
}

.teaching-style {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.teaching-style strong {
  padding: 5px 9px;
  border-radius: 999px;
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.additional-details {
  margin: 18px 0 0;
  padding-top: 18px;
  border-top: 1px solid var(--color-border);
  color: var(--color-text-muted);
  line-height: 1.5;
}

.match-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding-left: 20px;
  border-left: 1px solid var(--color-border);
}

.apply-btn {
  width: 110px;
  padding: 10px 16px;
  border: none;
  border-radius: var(--radius-control);
  background: var(--color-primary);
  color: white;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  margin-top: 30px;
}

.apply-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.apply-btn:disabled {
  background: #e5e7eb;
  color: #6b7280;
  cursor: not-allowed;
}

/* FR-022: the student rejected this application. */
.apply-btn.rejected:disabled {
  background: #fdecea;
  color: var(--color-error);
}

@media (max-width: 700px) {
  .assignment-card {
    grid-template-columns: 1fr;
  }

  .match-section {
    grid-row: 1;
    justify-self: end;
    padding: 0;
    border: none;
  }

  .assignment-details {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .card-header {
    flex-direction: column;
  }

  .match-section {
    justify-self: start;
  }
}
</style>