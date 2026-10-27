export {
  LEVELS,
  LOCATIONS,
  SUBJECTS,
} from './tutorFilters.js'

export const LEARNING_MODES = [
  'In-person',
  'Online',
  'Either',
]

export const PREFERRED_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

export const TIME_SLOTS = [
  {
    value: '08:00-10:00',
    label: '8:00 AM - 10:00 AM',
  },
  {
    value: '10:00-12:00',
    label: '10:00 AM - 12:00 PM',
  },
  {
    value: '12:00-14:00',
    label: '12:00 PM - 2:00 PM',
  },
  {
    value: '14:00-16:00',
    label: '2:00 PM - 4:00 PM',
  },
  {
    value: '16:00-18:00',
    label: '4:00 PM - 6:00 PM',
  },
  {
    value: '18:00-20:00',
    label: '6:00 PM - 8:00 PM',
  },
  {
    value: '20:00-22:00',
    label: '8:00 PM - 10:00 PM',
  },
]

export const POSTING_PERIODS = [
  {
    value: '',
    label: 'Any time',
  },
  {
    value: '1',
    label: 'Past 24 hours',
  },
  {
    value: '7',
    label: 'Past 7 days',
  },
  {
    value: '30',
    label: 'Past 30 days',
  },
]

export const BUDGET_MIN = 20
export const BUDGET_MAX = 100

export function createEmptyAssignmentFilters() {
  return {
    subject: '',
    level: '',
    location: '',
    learningModes: [],
    minimumBudget: null,
    preferredDay: '',
    preferredTimeSlot: '',
    postedWithinDays: '',
  }
}