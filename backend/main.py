from fastapi import FastAPI
import psycopg, os, requests, together

api_key = os.environ["LLM_API_KEY"]

def get_embedding(text, model = "togethercomputer/GPT-NeoXT-Chat-Base-20B"):
  endpoint_url = "https://api.together.xyz/api/v1/embeddings"
  
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

def infer_opinion(query, context: list[str]):
  new_line = "\n\n\n"
  output = together.Complete.create(
    prompt = f"""
      You are a fair and impartial opinion generator. Using the listed source documents, give an opinion on the provided statement.

      5 lines under the opinion, list the number corresponding to each source used to provide the opinion on a new line.
      
      Sources: {[
        f"{i + 1}: {line}" in context for i, line in enumerate(context)
      ].join(new_line)}

      Statement: {query}

      Opinion:
    """, 
    model = 'togethercomputer/StripedHyena-Nous-7B', 
    max_tokens = 256,
    temperature = 0.8,
    top_k = 60,
    top_p = 0.6,
    repetition_penalty = 1.1,
    stop = ['\n\n']
  )

  return output['output']['choices'][0]['text']

app = FastAPI()

@app.post("/")
def retrieve_nearest_viewpoints(query: str):
  with psycopg.connect() as conn:
    with conn.cursor() as cur:
      # Get the embedding of the query
      embedding = get_embedding(query)
      cur.execute(f"SELECT * FROM items ORDER BY embedding <-> '{embedding}' LIMIT 5;")

      items = cur.fetchall()
      return {
        "sources": items,
        "opinion": infer_opinion(query, [item[1] for item in items]),
      }
