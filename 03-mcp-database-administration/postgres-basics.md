# Postgres Basics for This Session

This is a quick primer for reading what MCP is doing. It is not a full SQL course.

## Core Terms

### Table

A table is a named collection of data in rows and columns.
Example: a `customer` table stores one customer per row.

### Row

A row is one record in a table.
Example: one row in `artist` is one artist.

### Column

A column is one field of data repeated across rows.
Example: `customer_id`, `first_name`, `email`.

### Primary Key

A primary key is the column (or set of columns) that uniquely identifies each row in a table.
Example: `artist_id` in `artist`.

### Foreign Key

A foreign key links a row in one table to a row in another table.
Example: `album.artist_id` points to `artist.artist_id`.

## What a JOIN Means (Conceptually)

A JOIN combines related data from multiple tables so you can ask one question across them.

Example concept:
- `customer` tells you who bought something.
- `invoice` tells you when they bought.
- A JOIN lets you view customer details together with invoice details.

You are matching related rows using keys, not merging files manually.

## What CREATE, ALTER, and DELETE Mean

- CREATE: make a new database object, usually a new table.
- ALTER: change an existing object, like adding a column.
- DELETE: remove rows from a table.

High-level caution:
- CREATE and ALTER change structure.
- DELETE changes data and can remove many rows if not scoped.

## Why This Matters in an MCP Workflow

You will not be writing most SQL by hand in this session. MCP generates SQL based on your prompts.

Still, understanding these terms helps you:
- Read the generated SQL
- Catch unsafe operations
- Ask better follow-up prompts

## Chinook Schema Orientation

The session focuses on these tables:

- artist: music artists
- album: albums created by artists
- track: songs on albums
- customer: store customers
- invoice: customer purchases
- employee: staff members

How they relate:

- artist -> album: one artist can have many albums
- album -> track: one album can have many tracks
- customer -> invoice: one customer can have many invoices
- employee -> customer: employees can support assigned customers

Quick mental model:
- Catalog side: artist, album, track
- Sales side: customer, invoice
- Support side: employee linked to customer

When you query with MCP, most practical questions cross these groups.
