from fastapi import FastAPI
import psycopg, os, requests

def get_embedding(text, model = "togethercomputer/GPT-NeoXT-Chat-Base-20B"):
  endpoint_url = "https://api.together.xyz/api/v1/embeddings"
  api_key = os.environ["LLM_API_KEY"]
  
  headers = {
      "Authorization": f"Bearer {api_key}",
      "Content-Type": "application/json",
  }
  
  data = {
      "model": model,
      "input": text[:512],
  }
  
  response = requests.post(endpoint_url, headers=headers, json=data)
  return response.json()["data"][0]["embedding"]

app = FastAPI()

@app.post("/")
def retrieve_nearest_viewpoints(query: str):
  with psycopg.connect() as conn:
    with conn.cursor() as cur:
      # Get the embedding of the query
      embedding = get_embedding(query)
      cur.execute(f"SELECT * FROM items ORDER BY embedding <-> '{embedding}' LIMIT 5;")

      # Return the top 5 results
      return cur.fetchall()
