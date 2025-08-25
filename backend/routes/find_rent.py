# from fastapi import APIRouter, Query
# from typing import List
# from sqlalchemy.sql import text, bindparam
# from database import database
# import re

# router = APIRouter()

# @router.get("/find_rent")
# async def find_rent(keywords: List[str] = Query(default=[])):
#     q_lower = " ".join(keywords).lower().replace(",", "")
#     print(f"[DEBUG] Raw keywords: {keywords}")
#     print(f"[DEBUG] Combined query string: {q_lower}")

#     min_price = 0
#     max_price = 99999999

#     # Match "between 5k and 10k"
#     between_match = re.search(r'between\s+(\d+)\s*(k)?\s*and\s*(\d+)\s*(k)?', q_lower)
#     if between_match:
#         min_price = float(between_match.group(1)) * (1000 if between_match.group(2) else 1)
#         max_price = float(between_match.group(3)) * (1000 if between_match.group(4) else 1)
#         print(f"[DEBUG] Matched 'between': {min_price} to {max_price}")
    
#     # Match "above 10000", "over 10k", "greater than 5000"
#     elif over := re.search(r"(over|above|greater than)\s+(\d+)\s*(k)?", q_lower):
#         min_price = float(over.group(2)) * (1000 if over.group(3) else 1)
#         print(f"[DEBUG] Matched 'over': {min_price}+")
    
#     # Match "under 8000", "below 8k", "less than 10k"
#     elif under := re.search(r"(under|below|less than)\s+(\d+)\s*(k)?", q_lower):
#         max_price = float(under.group(2)) * (1000 if under.group(3) else 1)
#         print(f"[DEBUG] Matched 'under': up to {max_price}")
    
#     # Match exact price like "1000", "10k"
#     elif exact := re.search(r"\b(\d+)\s*(k)?\b", q_lower):
#         exact_price = float(exact.group(1)) * (1000 if exact.group(2) else 1)
#         min_price = max_price = exact_price
#         print(f"[DEBUG] Matched exact: {exact_price}")

#     print(f"[DEBUG] Final price range: {min_price} to {max_price}")

#     sql = text("""
#         SELECT 
#             p.property_id, 
#             p.property_name,
#             p.city,
#             p.province,
#             MIN(u.rent_amount) AS rent_amount
#         FROM Property p
#         JOIN Unit u ON p.property_id = u.property_id
#         WHERE u.rent_amount BETWEEN :min_price AND :max_price
#         GROUP BY p.property_id
#         ORDER BY rent_amount ASC
#     """).bindparams(
#         bindparam("min_price", value=min_price),
#         bindparam("max_price", value=max_price),
#     )

#     rows = await database.fetch_all(sql)
#     return {
#         "keywords": keywords,
#         "min_price": min_price,
#         "max_price": max_price,
#         "results": rows,
#     }

# Working.

# from fastapi import APIRouter, Query
# from typing import List, Optional
# from sqlalchemy.sql import text, bindparam
# from database import database
# import re

# router = APIRouter()

# # Define known property types and synonyms
# PROPERTY_TYPE_MAP = {
#     "condo": "condo",
#     "condominium": "condo",
#     "apartment": "apartment",
#     "house": "house",
#     "townhouse": "townhouse",
#     "studio": "studio",
# }

# @router.get("/find_rent")
# async def find_rent(keywords: List[str] = Query(default=[])):
#     q_lower = " ".join(keywords).lower().replace(",", "")
#     print(f"[DEBUG] Combined query string: {q_lower}")

#     min_price = 0
#     max_price = 99999999
#     detected_type: Optional[str] = None

#     # Extract price logic (same as before)
#     if between := re.search(r'between\s+(\d+)\s*(k)?\s*and\s*(\d+)\s*(k)?', q_lower):
#         min_price = float(between.group(1)) * (1000 if between.group(2) else 1)
#         max_price = float(between.group(3)) * (1000 if between.group(4) else 1)
#         print(f"[DEBUG] Matched 'between': {min_price} to {max_price}")
#     elif over := re.search(r"(over|above|greater than)\s+(\d+)\s*(k)?", q_lower):
#         min_price = float(over.group(2)) * (1000 if over.group(3) else 1)
#         print(f"[DEBUG] Matched 'over': {min_price}+")
#     elif under := re.search(r"(under|below|less than)\s+(\d+)\s*(k)?", q_lower):
#         max_price = float(under.group(2)) * (1000 if under.group(3) else 1)
#         print(f"[DEBUG] Matched 'under': up to {max_price}")
#     elif exact := re.search(r"\b(\d+)\s*(k)?\b", q_lower):
#         exact_price = float(exact.group(1)) * (1000 if exact.group(2) else 1)
#         min_price = max_price = exact_price
#         print(f"[DEBUG] Matched exact: {exact_price}")

#     # Detect property type using keywords
#     for word in q_lower.split():
#         if word in PROPERTY_TYPE_MAP:
#             detected_type = PROPERTY_TYPE_MAP[word]
#             print(f"[DEBUG] Detected property type: {detected_type}")
#             break

#     print(f"[DEBUG] Final price range: {min_price} to {max_price}")

#     # Build SQL query dynamically
#     base_sql = """
#         SELECT 
#             p.property_id, 
#             p.property_name,
#             p.city,
#             p.province,
#             p.property_type,
#             MIN(u.rent_amount) AS rent_amount
#         FROM Property p
#         JOIN Unit u ON p.property_id = u.property_id
#         WHERE u.rent_amount BETWEEN :min_price AND :max_price
#     """

#     if detected_type:
#         base_sql += " AND LOWER(p.property_type) = :property_type"

#     base_sql += """
#         GROUP BY p.property_id, p.property_name, p.city, p.province, p.property_type
#         ORDER BY rent_amount ASC
#     """

#     sql = text(base_sql).bindparams(
#         bindparam("min_price", value=min_price),
#         bindparam("max_price", value=max_price),
#     )

#     if detected_type:
#         sql = sql.bindparams(bindparam("property_type", value=detected_type))

#     rows = await database.fetch_all(sql)

#     return {
#         "keywords": keywords,
#         "min_price": min_price,
#         "max_price": max_price,
#         "property_type": detected_type,
#         "results": rows,
#     }


from fastapi import APIRouter, Query
from typing import List, Optional
from sqlalchemy.sql import text, bindparam
from database import database
import spacy
import re

router = APIRouter()
nlp = spacy.load("en_core_web_sm")

PROPERTY_TYPE_MAP = {
    "condominium": "condo",
    "condo": "condo",
    "apartment": "apartment",
    "house": "house",
    "townhouse": "townhouse",
    "studio": "studio",
}

# Add more PH cities or provinces as needed
KNOWN_CITIES = ["manila", "makati", "quezon", "pasig", "pasay", "bulacan", "cavite", "cebu", "davao", "bacolod", "taguig"]

def extract_nlp_entities(text: str):
    doc = nlp(text.lower())
    text_lower = text.lower()

    min_price = 0
    max_price = 99999999
    property_type = None
    cities = set()

    # Extract money using regex (more reliable than spaCy for PH-style phrasing)
    price_matches = re.findall(r"(under|below|less than|over|above|greater than)?\s*₱?\s*(\d+[kK]?)", text_lower)
    for direction, amount in price_matches:
        try:
            val = amount.replace("₱", "").replace(",", "").strip().lower()
            if "k" in val:
                val = float(val.replace("k", "")) * 1000
            else:
                val = float(val)

            if direction in ["under", "below", "less than"]:
                max_price = val
            elif direction in ["over", "above", "greater than"]:
                min_price = val
            else:
                min_price = max_price = val
        except ValueError:
            continue

    # Detect cities manually (since spaCy misses some PH cities)
    for word in text_lower.split():
        clean_word = word.strip(",.")
        if clean_word in KNOWN_CITIES:
            cities.add(clean_word)

    # Property type detection via lemma
    for token in doc:
        lemma = token.lemma_.lower()
        if lemma in PROPERTY_TYPE_MAP:
            property_type = PROPERTY_TYPE_MAP[lemma]
            break

    return min_price, max_price, property_type, list(cities)

@router.get("/find_rent")
async def find_rent(keywords: List[str] = Query(default=[])):
    query_str = " ".join(keywords)
    print(f"[DEBUG] NLP Query: {query_str}")

    min_price, max_price, property_type, cities = extract_nlp_entities(query_str)
    print(f"[DEBUG] NLP Extracted - Min: {min_price}, Max: {max_price}, Type: {property_type}, Cities: {cities}")

    base_sql = """
        SELECT 
            p.property_id, 
            p.property_name,
            p.city,
            p.province,
            p.property_type,
            MIN(u.rent_amount) AS rent_amount
        FROM Property p
        JOIN Unit u ON p.property_id = u.property_id
        WHERE u.rent_amount BETWEEN :min_price AND :max_price
    """

    if property_type:
        base_sql += " AND LOWER(p.property_type) = :property_type"
    if cities:
        base_sql += " AND LOWER(p.city) IN :cities"

    base_sql += """
        GROUP BY p.property_id, p.property_name, p.city, p.province, p.property_type
        ORDER BY rent_amount ASC
    """

    sql = text(base_sql).bindparams(
        bindparam("min_price", value=min_price),
        bindparam("max_price", value=max_price),
    )

    if property_type:
        sql = sql.bindparams(bindparam("property_type", value=property_type))
    if cities:
        sql = sql.bindparams(bindparam("cities", expanding=True, value=cities))

    rows = await database.fetch_all(sql)

    return {
        "input": query_str,
        "min_price": min_price,
        "max_price": max_price,
        "property_type": property_type,
        "cities": cities,
        "results": rows,
    }
