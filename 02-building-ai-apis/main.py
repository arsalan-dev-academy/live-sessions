# Run with: uv run uvicorn main:app --reload

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from google import genai
from pydantic import BaseModel, Field

# Load GEMINI_API_KEY from a local .env file
load_dotenv(override=True)

app = FastAPI(title="AI API Live Session Demo")

# Single shared Gemini client, built once at startup
client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash-lite")


class GenerateRequest(BaseModel):
    prompt: str = Field(
        ...,
        examples=["Roast this Python function: def add(a,b): return a+b"],
    )


class GenerateResponse(BaseModel):
    response: str


@app.post(
    "/generate",
    response_model=GenerateResponse,
    summary="Generate text with Gemini",
    description="Sends a prompt to Gemini (gemini-2.0-flash) and returns the generated text.",
)
async def generate(body: GenerateRequest):
    try:
        # `.aio` is the async variant of the client, so this doesn't block the event loop
        result = await client.aio.models.generate_content(
            model=GEMINI_MODEL,
            contents=body.prompt,
        )
        return GenerateResponse(response=result.text)
    except Exception as exc:
        # Never leak a raw stack trace to the client - just a clean 500 + message
        return JSONResponse(
            status_code=500,
            content={"error": f"Gemini API call failed: {exc}"},
        )


# --- Classic CRUD example (in-memory, no DB) to demo GET / PUT / DELETE ---


class Item(BaseModel):
    name: str = Field(..., examples=["Rubber duck"])


# In-memory store: {item_id: Item}. Resets every time the server restarts.
items: dict[int, Item] = {}


@app.get(
    "/items",
    summary="List items",
    description="Returns all items currently in the in-memory store.",
)
async def list_items():
    return items


@app.get(
    "/items/{item_id}",
    summary="Get one item",
    description="Returns a single item by id, or a 404 if it doesn't exist.",
)
async def get_item(item_id: int):
    if item_id not in items:
        return JSONResponse(status_code=404, content={"error": f"Item {item_id} not found"})
    return items[item_id]


@app.put(
    "/items/{item_id}",
    summary="Create or replace an item",
    description="Upserts an item at the given id: creates it if new, overwrites it if it already exists.",
)
async def put_item(item_id: int, item: Item):
    items[item_id] = item
    return item


@app.delete(
    "/items/{item_id}",
    summary="Delete an item",
    description="Removes an item by id, or a 404 if it doesn't exist.",
)
async def delete_item(item_id: int):
    if item_id not in items:
        return JSONResponse(status_code=404, content={"error": f"Item {item_id} not found"})
    del items[item_id]
    return {"deleted": item_id}
