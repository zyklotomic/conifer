from fastapi import FastAPI
import psycopg, os, requests, together
from pgvector.psycopg import register_vector

api_key = os.environ["LLM_API_KEY"]
DB_CONN = "host=localhost port=5432 user=postgres" \
    " password=example_password"

import numpy as np

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
  return np.array(response.json()["data"][0]["embedding"])

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
def retrieve_nearest_viewpoints(content_to_embed: str):
  with psycopg.connect(DB_CONN) as conn:
    register_vector(conn)
    with conn.cursor() as cur:
      # Get the embedding of the query
      embedding = get_embedding(content_to_embed)
      pg_query = \
      """
        SELECT
            news_vectors.uri, lead_paragraph, web_url,
            1 - (embedding <=> %s) AS cos_sim
        FROM news_vectors
        INNER JOIN news_data ON news_vectors.uri LIKE news_data.uri
        WHERE
            1 - (embedding <=> %s) > 0.70
        ORDER BY
            1 - (embedding <=> %s) DESC
        LIMIT
            5     
      """
      cur.execute(pg_query, (embedding, embedding, embedding))

      res = cur.fetchall()
      sources = []
      for r in res:
        uri, lead_paragraph, web_url, cos_sim = r
        sources.append({
          'uri': uri,
          'lead_paragraph': lead_paragraph,
          'web_url': web_url,
          'cos_sim': cos_sim
        })

      lead_paragraphs =  [ s['lead_paragraph'] for s in sources ]

      return {
        "sources": sources,
        "opinion": infer_opinion(content_to_embed, lead_paragraphs),
      }
