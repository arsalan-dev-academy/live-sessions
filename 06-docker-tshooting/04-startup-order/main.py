import logging
import os
from contextlib import asynccontextmanager

import psycopg
from fastapi import FastAPI, HTTPException
from psycopg.rows import dict_row
from pydantic import BaseModel

DATABASE_URL = os.environ["DATABASE_URL"]

log = logging.getLogger("uvicorn.error")


class NoteIn(BaseModel):
    text: str


def connect():
    return psycopg.connect(DATABASE_URL, connect_timeout=3, row_factory=dict_row)


@asynccontextmanager
async def lifespan(app: FastAPI):
    with connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS notes (
                id         SERIAL PRIMARY KEY,
                text       TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """
        )
    yield


app = FastAPI(title="Notes API", lifespan=lifespan)


@app.get("/health")
def health():
    try:
        with connect() as conn:
            conn.execute("SELECT 1")
    except psycopg.OperationalError as exc:
        log.error("database check failed: %s", exc)
        raise HTTPException(status_code=503, detail="database unavailable")
    return {"status": "ok"}


@app.post("/notes", status_code=201)
def create_note(note: NoteIn):
    with connect() as conn:
        return conn.execute(
            "INSERT INTO notes (text) VALUES (%s) RETURNING id, text, created_at",
            (note.text,),
        ).fetchone()


@app.get("/notes")
def list_notes():
    with connect() as conn:
        return conn.execute(
            "SELECT id, text, created_at FROM notes ORDER BY id"
        ).fetchall()
