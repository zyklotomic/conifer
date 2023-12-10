from fastapi import FastAPI
import psycopg

app = FastAPI()

@app.post("/")
def retrieve_nearest_viewpoints(query: str):
  with psycopg.connect() as conn:
    with conn.cursor() as cur:
      # Get the embedding of the query
      embedding = query
      cur.execute(f"SELECT * FROM items ORDER BY embedding <-> '{embedding}' LIMIT 5;")

      # Return the top 5 results
      return cur.fetchall()
