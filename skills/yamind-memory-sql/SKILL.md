---
name: yamind-memory-sql
description: A persistent SQL-based memory store for the agency. Allows storing and retrieving structured facts, conversation logs, and entity relationships to enhance brainstorming and context retention.
---

# SQL Memory Skill

This skill provides a structured memory backend using SQLite. It allows the agent to move beyond flat files for complex querying.

## Database Schema

### `facts`
- `id` (INTEGER PRIMARY KEY)
- `subject` (TEXT) - e.g., "Sarah", "Project X"
- `predicate` (TEXT) - e.g., "is", "has_goal"
- `object` (TEXT) - e.g., "Shapeshifter", "Funding"
- `context` (TEXT) - Optional JSON context or tags
- `timestamp` (DATETIME)

### `ideas`
- `id` (INTEGER PRIMARY KEY)
- `title` (TEXT)
- `content` (TEXT)
- `tags` (TEXT)
- `status` (TEXT) - e.g., "draft", "approved", "rejected"
- `created_at` (DATETIME)

### `logs`
- `id` (INTEGER PRIMARY KEY)
- `session_id` (TEXT)
- `role` (TEXT)
- `message` (TEXT)
- `timestamp` (DATETIME)

## Tools

### `memory_sql_init`
Initializes the SQLite database if it doesn't exist.

### `memory_sql_insert_fact`
Inserts a new fact triple.

### `memory_sql_query_facts`
Searches facts by subject, predicate, or object (fuzzy match).

### `memory_sql_log_idea`
Stores a brainstorming idea.

### `memory_sql_search_ideas`
Finds ideas by keyword or tag.
