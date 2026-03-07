import sqlite3
import argparse
import json
import datetime
import sys

DB_PATH = "agency/snapshot/memory/agency_memory.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS facts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject TEXT NOT NULL,
            predicate TEXT NOT NULL,
            object TEXT NOT NULL,
            context TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ideas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            tags TEXT,
            status TEXT DEFAULT 'draft',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            role TEXT,
            message TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()
    print("Database initialized successfully.")

def insert_fact(subject, predicate, object_val, context=None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO facts (subject, predicate, object, context) VALUES (?, ?, ?, ?)",
                   (subject, predicate, object_val, context))
    conn.commit()
    conn.close()
    print(f"Fact inserted: {subject} {predicate} {object_val}")

def query_facts(query):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    search_term = f"%{query}%"
    cursor.execute("SELECT * FROM facts WHERE subject LIKE ? OR predicate LIKE ? OR object LIKE ?",
                   (search_term, search_term, search_term))
    results = cursor.fetchall()
    conn.close()
    print(json.dumps(results, indent=2))

def log_idea(title, content, tags=None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO ideas (title, content, tags) VALUES (?, ?, ?)",
                   (title, content, tags))
    conn.commit()
    conn.close()
    print(f"Idea logged: {title}")

def search_ideas(keyword):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    search_term = f"%{keyword}%"
    cursor.execute("SELECT * FROM ideas WHERE title LIKE ? OR content LIKE ? OR tags LIKE ?",
                   (search_term, search_term, search_term))
    results = cursor.fetchall()
    conn.close()
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SQL Memory Manager")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Init
    parser_init = subparsers.add_parser("init", help="Initialize the database")

    # Insert Fact
    parser_fact = subparsers.add_parser("fact", help="Insert a fact")
    parser_fact.add_argument("subject", help="Subject of the fact")
    parser_fact.add_argument("predicate", help="Predicate of the fact")
    parser_fact.add_argument("object", help="Object of the fact")
    parser_fact.add_argument("--context", help="Optional JSON context", default=None)

    # Query Facts
    parser_query = subparsers.add_parser("query_facts", help="Query facts")
    parser_query.add_argument("query", help="Search term")

    # Log Idea
    parser_idea = subparsers.add_parser("idea", help="Log an idea")
    parser_idea.add_argument("title", help="Idea title")
    parser_idea.add_argument("content", help="Idea content")
    parser_idea.add_argument("--tags", help="Tags (comma separated)", default=None)

    # Search Ideas
    parser_search = subparsers.add_parser("search_ideas", help="Search ideas")
    parser_search.add_argument("keyword", help="Search keyword")

    args = parser.parse_args()

    if args.command == "init":
        init_db()
    elif args.command == "fact":
        insert_fact(args.subject, args.predicate, args.object, args.context)
    elif args.command == "query_facts":
        query_facts(args.query)
    elif args.command == "idea":
        log_idea(args.title, args.content, args.tags)
    elif args.command == "search_ideas":
        search_ideas(args.keyword)
