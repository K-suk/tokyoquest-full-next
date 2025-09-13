# Stories System

The Stories System is a narrative-driven feature that unlocks story chapters as players level up, providing an immersive experience that complements the quest-based gameplay.

## Overview

- **10 Story Chapters**: Each level (1-10) unlocks a corresponding story chapter
- **Riddles**: Most chapters include thought-provoking riddles for players to answer
- **Progressive Unlocking**: Chapters unlock automatically when players reach the required level
- **Persistent Progress**: Reading progress and riddle answers are saved per user

## Data Model

### StoryChapter
```prisma
model StoryChapter {
  id          Int      @id @default(autoincrement())
  level       Int      @unique
  title       String
  bodyEn      String   @db.Text
  riddleEn    String?  @db.Text
  themeHints  String[]
  estReadSec  Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### StoryProgress
```prisma
model StoryProgress {
  id                String   @id @default(cuid())
  userId            String   @unique
  unlockedLevels    Int[]
  lastReadAtByLevel Json     @default("{}")
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### StoryAnswer
```prisma
model StoryAnswer {
  id        String   @id @default(cuid())
  userId    String
  level     Int
  answer    String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, level])
}
```

## API Endpoints

### GET /api/stories
Returns all story chapters with user's progress and unlock status.

**Response:**
```json
{
  "chapters": [
    {
      "id": 1,
      "level": 1,
      "title": "The Call",
      "themeHints": ["trace", "memory", "setup"],
      "estReadSec": 90,
      "unlocked": true,
      "lastReadAt": "2024-01-01T00:00:00Z",
      "hasAnswer": false,
      "hasRiddle": false
    }
  ],
  "unlockedLevels": [1, 2, 3],
  "totalChapters": 10
}
```

### GET /api/stories/[level]
Returns a specific story chapter (requires unlock).

**Response:**
```json
{
  "id": 1,
  "level": 1,
  "title": "The Call",
  "bodyEn": "Do you hear me? This voice comes from...",
  "riddleEn": "If no one acknowledges you...",
  "themeHints": ["trace", "memory", "setup"],
  "estReadSec": 90,
  "userAnswer": "My thoughts on the riddle..."
}
```

### POST /api/stories/unlock
Unlocks a story level (idempotent).

**Request:**
```json
{ "level": 5 }
```

**Response:**
```json
{
  "success": true,
  "unlockedLevels": [1, 2, 3, 4, 5],
  "newlyUnlocked": 5
}
```

### POST /api/stories/[level]/answer
Saves a user's answer to a riddle.

**Request:**
```json
{ "answer": "My thoughts on the riddle..." }
```

**Response:**
```json
{
  "success": true,
  "answer": "My thoughts on the riddle..."
}
```

### POST /api/stories/[level]/read
Marks a story as read and tracks reading progress.

**Request:**
```json
{ "readMs": 45000, "scrollDepth": 0.95 }
```

## Level-Up Integration

The system automatically unlocks story chapters when players level up:

1. **Quest Completion**: When a quest is completed, experience is gained
2. **Level Calculation**: New level is calculated based on total experience
3. **Story Unlock**: If level increased, corresponding story chapters are unlocked
4. **Notification**: Level-up modal appears with story unlock notification
5. **Telemetry**: Events are tracked for analytics

### Level Calculation
- **Level 1**: 0-999 EXP
- **Level 2**: 1000-1999 EXP
- **Level 3**: 2000-2999 EXP
- etc.

Each quest completion grants 100 EXP.

## UI Components

### StoryCard
Displays story chapter metadata with unlock status, reading progress, and theme tags.

### StoryReader
Modal component for reading story chapters with:
- Full-screen reading experience
- Riddle answer input
- Progress tracking
- Keyboard navigation (ESC to close)
- Accessibility features

### StoryTimeline
Visual timeline showing progression through all 10 chapters with saturation effects.

### StoryFilters
Filter chapters by themes and jump to chapters with riddles.

## Pages

### /stories
Main stories page featuring:
- Timeline view of all chapters
- Filterable chapter grid
- Theme-based filtering
- Riddle quick-access

### /stories/[level]
Individual story chapter page with full reading experience.

## Telemetry Events

The system tracks the following events:

- `story_unlocked`: When a new chapter is unlocked
- `story_opened`: When a chapter is opened (with source context)
- `story_completed`: When a chapter is fully read
- `story_answer_saved`: When a riddle answer is saved

## Seeding

To populate the database with story content:

```bash
npm run seed:stories
```

This will create all 10 story chapters with the provided content.

## Accessibility Features

- **Focus Management**: Proper focus trapping in modals
- **Keyboard Navigation**: ESC to close, tab navigation
- **Screen Reader Support**: ARIA labels and descriptions
- **Reduced Motion**: Respects user's motion preferences
- **High Contrast**: Sufficient color contrast ratios

## Testing

Run the level system tests:

```bash
npm test -- level-system
```

## Future Enhancements

- **Internationalization**: Support for multiple languages
- **Audio Narration**: Voice-over for story chapters
- **Interactive Elements**: Clickable story elements
- **Social Features**: Share riddle answers with friends
- **Achievements**: Badges for completing story arcs
