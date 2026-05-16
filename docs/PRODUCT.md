# Product Definition

## Problem Statement

Knowledge workers — developers, students, and self-learners — consistently struggle to recall and articulate what they have worked on and learned over time. This makes performance reviews, resume updates, and job interviews unnecessarily difficult. Existing tools like Notion are too heavy and unstructured, while plain journals lack organisation and produce no meaningful insights. There is no dedicated, lightweight tool that lets people log both work and learning in a structured way and automatically surfaces progress over time.

---

## Target User

A developer or self-learner, aged 22 to 35, who is actively upskilling, job hunting, or growing in their career. They want to track their progress but do not want to maintain a complex system. They care about being able to articulate their growth to others — in interviews, on resumes, or to themselves.

Primary user type for MVP: individual developer or self-learner.
Secondary users (for later versions): managers wanting team visibility, bootcamp students.

---

## MVP Scope

- User registration and login
- Onboarding flow to set up at least 1 category (subcategory optional) before the user can start logging
- Daily log entry: markdown text, entry type (WORK or LEARNING), category, sub-category, productivity score (1 to 10, optional), and date
- Basic dashboard showing recent entries and a simple category breakdown
- Ability to edit and delete entries
- Settings page for managing categories and sub-categories

---

## Out of Scope for MVP

- AI-generated weekly summaries
- Git, Jira, or PR integrations
- Streak tracking and gamification
- Visualisations and growth timeline
- Resume or performance review export
- Mobile application
- Public profile or shareable links
- Team or collaborative features
- Stripe billing (infrastructure prepared, not activated)

---

## Success Criteria for MVP

- 10 real users (outside of friends and family) actively using the product
- Users returning and logging entries at least 3 times per week
- At least 5 users giving direct feedback on what they want next

---

## MVP User Stories

### Authentication

**As a user, I want to create an account, so that my data is private and personal to me.**

- User can register using an email address and password
- Password must meet a minimum security requirement (at least 8 characters, one number, one special character)
- System sends a verification email after registration
- User cannot log in until email is verified
- If the email is already registered, the system shows a clear error message
- After successful registration, user is redirected to the onboarding flow, not the dashboard

**As a user, I want to log in and out securely, so that I can access my data from any device.**

- User can log in using their registered email and password
- If credentials are wrong, system shows a generic error without specifying which field is wrong
- After a successful login, user is redirected to their dashboard
- User session persists across browser refreshes
- User can explicitly log out from any page
- After logout, user is redirected to the login page and cannot navigate back using the browser back button

### Category Setup

**As a user, I want to quickly set up one category during onboarding, so that I can start logging immediately without a lengthy setup.**

- Onboarding screen is shown only once, immediately after first login
- User must create at least 1 category to complete onboarding
- Each category requires a name
- Sub-categories are optional during onboarding — the user can skip them and add later from settings
- User can edit or delete a category before completing onboarding
- Category names must be unique per user
- After completing onboarding, user lands on the dashboard
- Additional categories and sub-categories are created from the settings page after onboarding, up to the limits of the user's plan

**As a user, I want to add sub-categories under each main category, so that I can track topics with more granularity.**

- Each main category can have one or more sub-categories
- Sub-categories are fully optional — at onboarding and throughout the product
- Sub-category names must be unique within the same parent category
- User can add, edit, complete, or delete sub-categories at any point after onboarding via settings
- If a sub-category has existing log entries attached to it, it can be marked as complete (entries are preserved) but cannot be hard deleted
- When a sub-category is completed, entries that referenced it retain the main category and the sub-category tag (for history and analytics)

### Daily Logging

**As a user, I want to quickly add a log entry with text, a date, and a category, so that capturing progress takes less than a minute.**

- Log entry form is accessible directly from the dashboard with a single click
- Required fields: entry text, entry type, main category, date
- Optional fields: sub-category, productivity score
- Date field defaults to today but user can change it to log a past entry
- Entry text has a minimum of 10 characters
- Entry text has a maximum of 1000 characters
- Entry text supports markdown formatting
- User receives a clear confirmation after a log is saved
- After saving, the form resets so user can quickly add another entry
- User can cancel the form at any point without saving

**As a user, I want to tag an entry as either work or learning, so that I can distinguish between the two types of progress.**

- Entry type is a required field with exactly two options: Work and Learning
- The selected type is visually distinct when viewing entries in the dashboard
- User can filter their log history by entry type
- Entry type can be changed when editing an existing entry

**As a user, I want to rate how productive each entry felt with a score, so that I can later reflect on the quality of my effort, not just the quantity.**

- Each log entry has an optional productivity score field
- Score is a whole number between 1 and 10
- A brief label helps the user understand the scale (1 = felt completely unproductive, 10 = deeply focused and effective)
- If user skips the score, the entry is still saved successfully
- Score can be added or updated when editing an existing entry
- Score is displayed alongside the entry in the log history view
- Score data is stored per entry to power dashboard visualisations later

### Dashboard and Review

**As a user, I want to see my recent entries in a clean list, so that I can review what I have been doing lately.**

- Dashboard shows the most recent 10 entries by default
- Each entry in the list shows: date, entry type tag, main category, sub-category if set, a truncated preview of the entry text, and productivity score if set
- User can click an entry to expand and read the full text
- User can edit or delete any entry directly from this view
- User can load older entries via pagination or a load more button
- List is sorted by date descending by default

**As a user, I want to see a summary of my activity by category, so that I can understand where I am spending my time and energy.**

- Dashboard includes a simple breakdown showing how many entries exist per main category
- Breakdown is filterable by time period: last 7 days, last 30 days, all time
- If productivity scores are present, the breakdown also shows the average score per category
- If the user has no entries yet, the dashboard shows an empty state with a prompt to add their first log

### Editing and Deletion

**As a user, I want to edit a previously saved entry, so that I can correct mistakes or add detail I missed.**

- User can edit any existing entry from the dashboard list view
- All fields are editable: text, type, category, sub-category, date, and productivity score
- Edited entries show the original creation date, not the edit date
- User receives confirmation after a successful edit

**As a user, I want to delete an entry, so that I can remove logs that are no longer relevant or were added by mistake.**

- User can delete any entry from the dashboard list view
- Before deletion, a confirmation prompt is shown
- Deletion is permanent with no recovery at MVP stage
- After deletion, the list updates immediately without a full page reload

---

## Non-MVP User Stories

### AI-Generated Weekly Summary

**As a user, I want to receive an AI-generated summary of my week, so that I can reflect on my progress without manually reviewing all my entries.**

- Every week (defaulting to Sunday evening) the system automatically generates a summary based on that week's log entries
- Summary includes: total entries logged, breakdown by type, most active category, average productivity score for the week, and a short AI-written narrative paragraph
- Summary is delivered to the user's registered email address
- Summary is also accessible inside the app in a dedicated Weekly Reviews section
- User can choose their preferred delivery day and time from settings
- If the user has logged zero entries that week, no summary email is sent
- User can opt out of summary emails entirely from settings without losing the in-app weekly review feature

**As a user, I want to view all my past weekly summaries in one place, so that I can track how my focus has shifted over time.**

- A Weekly Reviews page lists all past AI-generated summaries in reverse chronological order
- Each summary shows the week date range, total entries, top category, and average score
- User can click into any past summary to read the full AI narrative
- Weeks with no entries do not appear in the list

### Git, Jira, and PR Integrations

**As a user, I want to connect my GitHub account, so that my commits are automatically pulled in as work log entries.**

- User can connect their GitHub account from settings via OAuth
- After connecting, user selects which repositories to sync
- System pulls commits from selected repositories on a daily basis
- Each commit becomes a log entry with the commit message as entry text, type set to Work, and date set to commit date
- Auto-imported entries are tagged with a source indicator
- User can edit or delete auto-imported entries like any manual entry
- User can disconnect GitHub at any time, which stops future syncing but does not delete already-imported entries

**As a user, I want to connect my Jira account, so that completed tickets are automatically logged as work entries.**

- User can connect their Jira account from settings using an API token
- User selects which Jira project boards to sync
- System pulls tickets moved to Done status on a daily basis
- Each completed ticket becomes a log entry with the ticket title as entry text
- User can disconnect Jira at any time from settings

**As a user, I want merged pull requests to be automatically logged, so that significant pieces of work are captured without manual effort.**

- Merged PRs from connected GitHub repositories are pulled in separately from individual commits
- Each merged PR becomes a log entry with the PR title as entry text
- User can configure whether they want both commits and PRs imported, or only one, to avoid duplicate entries

### Streak Tracking and Gamification

**As a user, I want to see my current logging streak, so that I feel motivated to log something every day.**

- A streak counter is displayed prominently on the dashboard
- Streak increments by one for each calendar day the user logs at least one entry
- If the user misses a day, the streak resets to zero
- The longest streak ever achieved is stored and displayed separately as a personal best
- A subtle visual or message appears when the user hits milestone streaks (7 days, 30 days, 100 days)
- Logging a past entry does not count toward the current streak

**As a user, I want a momentum score, so that I can see a more holistic measure of my consistency beyond just a daily streak.**

- Momentum score is a calculated number (0 to 100) based on logging frequency and average productivity scores over the last 30 days
- Score is displayed on the dashboard alongside the streak counter
- A brief tooltip explains how the score is calculated
- Score updates once per day

### Growth Timeline Visualisation

**As a user, I want to see a visual timeline of how my learning has evolved, so that I can appreciate how far I have come.**

- A dedicated Growth page shows a month-by-month visual breakdown of log activity
- Each month is represented as a bar or block showing total entries split by category
- User can scroll back through months to see historical activity
- Months with no entries are shown as empty rather than hidden

**As a user, I want to see an activity heatmap, so that I can identify patterns in when I am most consistent.**

- A GitHub-style contribution heatmap shows one square per day for the last 12 months
- Square colour intensity reflects the number of entries logged that day
- Hovering over a square shows the date and entry count for that day

**As a user, I want to see my average productivity score trend over time, so that I can tell if the quality of my effort is improving.**

- A line chart on the Growth page shows average productivity score per week over the last 3 months
- Chart is filterable by category
- Weeks with fewer than 3 scored entries are shown as a gap rather than an inaccurate average

### Resume and Performance Review Export

**As a user, I want to export a summary of my activity as a structured document, so that I can use it when updating my resume or preparing for a performance review.**

- User can trigger an export from the dashboard
- User selects a date range and entry type filter
- Export is generated as a PDF or markdown file
- Exported document includes total entries, breakdown by category, highlight entries, and a chronological summary
- AI optionally rewrites the summary in a professional tone suitable for a resume

### Public Learning Profile

**As a user, I want a shareable public profile page, so that I can show my learning journey to potential employers or the community.**

- User can enable a public profile from settings, off by default
- Public profile shows display name, categories being tracked, activity heatmap, category breakdown, and total days active
- Individual log entry text is never shown publicly unless explicitly marked as public
- User gets a unique shareable URL
- User can disable the public profile at any time
