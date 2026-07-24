# Movie Explorer Bot — Bot specification

**Archetype:** content

**Voice:** friendly and helpful — write every user-facing message, button label, error, and empty state in this voice.

A Telegram bot that helps users discover movies by providing now-playing listings, popular/trending titles, search by title or actor, and mood/genre-based recommendations. Admin notifications are sent to the owner's Telegram chat.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- casual moviegoers
- users seeking film suggestions
- movie enthusiasts

## Success criteria

- User can find nearby showtimes and movie details
- User receives personalized recommendations by mood/genre
- Admin receives notifications about user activity and alerts

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open the main menu with quick actions
- **Now Playing Near Me** (button, actor: user, callback: now_playing:start) — Show movies playing nearby with location permission or manual input
  - inputs: location permission or city/ZIP
  - outputs: movie listings with showtimes
- **Popular/Trending** (button, actor: user, callback: trending:start) — List current trending movies with pagination
  - inputs: none
  - outputs: trending movie cards with actions
- **Search** (button, actor: user, callback: search:start) — Free-text search by title or actor
  - inputs: search query
  - outputs: matching movie cards with actions
- **Recommend by Mood/Genre** (button, actor: user, callback: recommend:start) — Get curated recommendations by mood or genre
  - inputs: mood/genre selection or custom input
  - outputs: curated movie list with rationale
- **My Preferences** (button, actor: user, callback: preferences:start) — View and update saved preferences and subscriptions
  - inputs: none
  - outputs: user preferences interface

## Flows

### now_playing_flow
_Trigger:_ now_playing:start

1. Request location permission or manual input
2. Fetch nearby showtimes
3. Display movie cards with showtimes

_Data touched:_ User, Movie

### trending_flow
_Trigger:_ trending:start

1. Fetch trending movies
2. Display paginated movie cards
3. Handle movie card actions

_Data touched:_ Movie, Recommendation request

### search_flow
_Trigger:_ search:start

1. Request search query
2. Fetch matching movies
3. Display movie cards with actions

_Data touched:_ Movie

### recommend_flow
_Trigger:_ recommend:start

1. Display mood/genre buttons
2. Handle selection or custom input
3. Generate curated list and rationale

_Data touched:_ Recommendation request, Movie

### preferences_flow
_Trigger:_ preferences:start

1. Display saved preferences
2. Handle updates to preferences

_Data touched:_ User

### notification_flow
_Trigger:_ notification:trigger

1. Send admin notification to owner's chat
2. Confirm notification sent

_Data touched:_ Notification

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **Movie** _(retention: persistent)_ — Movie details including title, poster, synopsis, release date, genres, cast, runtime, rating, and availability
  - fields: title, poster, synopsis, release_date, genres, cast, runtime, rating, availability
- **User** _(retention: persistent)_ — User profile including Telegram id, location, and preferences
  - fields: telegram_id, location, favorite_genres, favorite_moods
- **Recommendation request** _(retention: session)_ — User request for movie recommendations by mood or genre
  - fields: mood, genre, filters
- **Notification** _(retention: session)_ — Admin notification about user activity or alerts
  - fields: message, timestamp, recipient

## Integrations

- **Telegram** (required) — Bot API messaging
- **Public movie data API** (required) — Fetch movie details, showtimes, and trending lists
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- Configure movie data API
- Set notification thresholds
- View admin notifications in specified chat

## Notifications

- Admin notifications about user activity and alerts
- User notifications for movie releases and trending alerts

## Permissions & privacy

- Request location permission with clear purpose
- Store minimal user data with opt-in preferences

## Edge cases

- User denies location permission
- No showtimes found for location
- No trending movies available
- Search query returns no results
- Custom mood/genre input validation

## Required tests

- Verify location-based showtimes display correctly
- Test trending movie list pagination
- Validate search query returns matching movies
- Confirm recommendation flow generates curated list
- Ensure admin notifications are sent to correct chat

## Assumptions

- Public movie data API is available and reliable
- Users are comfortable with location sharing or manual input
- Owner provides valid admin chat ID for notifications
