from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Query
import spacy
from database import database  # adjust path if needed
from routes.find_rent import router as find_rent_router
import re

app = FastAPI()
nlp = spacy.load("en_core_web_sm")
origins = [
    "https://sturdy-space-parakeet-9xp45vxp75x3xwx-3000.app.github.dev",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

@app.get("/test-db")
async def test_db():
    result = await database.fetch_one("SELECT 1")
    return {"db_connected": bool(result)}

import re
from fastapi import Query

def convert_token(token):
    text = token.text.lower()
    if text.endswith("k") and text[:-1].isdigit():
        return str(int(text[:-1]) * 1000)
    elif token.like_num:
        return token.text
    elif token.is_alpha or text in {"under", "less", "than", "above", "over"}:
        return token.lemma_
    return None

@app.get("/analyze")
def analyze_query(q: str = Query(..., min_length=1)):
    doc = nlp(q)
    keywords = [k for token in doc if (k := convert_token(token))]
    return {"original": q, "keywords": keywords}


app.include_router(find_rent_router)

