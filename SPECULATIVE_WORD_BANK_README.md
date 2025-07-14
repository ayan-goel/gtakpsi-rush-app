# Speculative Word Bank Feature (Frontend Only)

## Overview

The speculative word bank feature has been implemented as a **frontend-only solution** to help brothers write more objective and concrete comments about rushees. It flags potentially problematic language and provides warnings when:

1. **Speculative language** is detected (e.g., "will", "probably", "might", "good fit")
2. **Rushee names** are mentioned in comments (should use "the rushee" or "they" instead)

## Implementation Details

### Frontend Components

#### 1. Speculative Word Bank (`client/src/js/speculativeWordBank.js`)
- Contains a comprehensive list of speculative words and phrases
- Provides functions to detect speculative language and rushee names
- Includes validation and warning generation utilities
- **Client-side only** - no backend dependencies

#### 2. Comment Warning Component (`client/src/components/CommentWarning.jsx`)
- Displays warnings with appropriate icons and styling
- Supports dismissible warnings
- Different styling for different warning types

#### 3. Integration Points
- **RusheeZoom.jsx**: Comment submission and editing
- **PIS.jsx**: PIS answer validation

### Frontend-Only Validation

#### 1. Real-time Validation
- All validation happens in the browser as users type
- No server requests needed for validation
- Instant feedback for better user experience

#### 2. Warning Display
- Warnings appear immediately below input fields
- Toast notifications for submission warnings
- Dismissible warnings for better UX

## Word Bank Categories

### Future-oriented Speculation
- will, would, could, should, might, may, can, shall
- going to, gonna, planning to, intending to, expecting to

### Conditional Speculation
- if, when, assuming, supposing, provided that, in case
- unless, otherwise, alternatively

### Uncertainty Indicators
- maybe, perhaps, possibly, potentially, likely, unlikely
- probably, definitely, certainly, surely, obviously

### Comparative Speculation
- better, worse, best, worst, more, less, most, least
- improve, decline, grow, shrink, increase, decrease

### Time-based Speculation
- eventually, someday, in the future, later, soon
- one day, sometime

### Character/Personality Speculation
- seems like, appears to be, looks like, sounds like, feels like
- gives the impression, comes across as, strikes me as

### Academic/Professional Speculation
- good fit, bad fit, suitable, unsuitable, qualified, unqualified
- capable, incapable, competent, incompetent

### Social Speculation
- popular, unpopular, well-liked, disliked, friendly, unfriendly
- outgoing, shy, confident, insecure

### Performance Speculation
- successful, unsuccessful, productive, unproductive, efficient, inefficient
- effective, ineffective, valuable, worthless

## Usage

### For Brothers Writing Comments

1. **Real-time Validation**: As you type comments, warnings appear immediately
2. **Warning Types**:
   - 🟡 **Yellow warnings**: Speculative language detected
   - 🔴 **Red warnings**: Rushee's name detected
3. **Dismissible Warnings**: Click the × to dismiss individual warnings
4. **Submission**: Comments with warnings can still be submitted, but a warning toast appears

### For PIS Answers

1. **Text Answers**: Real-time validation for text-based PIS questions
2. **Voice Transcription**: Validation applies to voice-transcribed text as well
3. **Warning Display**: Warnings appear below each answer field

## Technical Features

### Frontend
- Real-time validation as users type
- Visual warning indicators with icons
- Dismissible warning messages
- Toast notifications for submission warnings
- Responsive design that works on all screen sizes
- Client-side regex patterns with word boundaries
- Case-insensitive detection
- Comprehensive word bank with 50+ terms

### Performance
- Efficient regex patterns with word boundaries
- Minimal impact on typing performance
- No server requests needed for validation
- Instant feedback for better user experience

## Configuration

### Adding New Words
To add new speculative words, edit the `SPECULATIVE_WORDS` array in:
- `client/src/js/speculativeWordBank.js`

### Customizing Warning Messages
Warning messages can be customized in:
- `generateWarnings()` function in `client/src/js/speculativeWordBank.js`

## Testing

A simple test file is included at `client/src/js/speculativeWordBank.test.js` to verify functionality.

## Future Enhancements

Potential improvements could include:
1. Machine learning-based detection for more nuanced language
2. Context-aware validation (some words are speculative only in certain contexts)
3. Custom word banks per organization or chapter
4. Analytics on most commonly flagged terms
5. Suggestion system for alternative phrasing 