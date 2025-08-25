import os
from databases import Database
from sqlalchemy import create_engine, MetaData
from dotenv import load_dotenv

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path)

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

DATABASE_URL = f"mysql+aiomysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Async database connection
database = Database(DATABASE_URL)

# For migrations / sync access
metadata = MetaData()
engine = create_engine(DATABASE_URL.replace("aiomysql", "pymysql"))  # pymysql for sync
