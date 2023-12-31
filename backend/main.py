from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg, os, requests, together
from pgvector.psycopg import register_vector
import numpy as np

api_key = os.environ["LLM_API_KEY"]
PORT = 5431
DB_CONN = f"host=localhost port={PORT} user=postgres" \
    " password=example_password"
together.api_key = api_key
 
def get_embedding(text, model = "togethercomputer/bert-base-uncased"):
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

      Format the response in plaintext. DO NOT include any other text.
      
      Sources: {new_line.join(
        f"{i + 1}: {line}" for i, line in enumerate(context)
      )}

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class OpinionQuery(BaseModel):
    content_to_embed: str

@app.post("/")
def retrieve_nearest_viewpoints(opinion_request: OpinionQuery):
  with psycopg.connect(DB_CONN) as conn:
    register_vector(conn)
    with conn.cursor() as cur:
      # Get the embedding of the query
      embedding = get_embedding(opinion_request.content_to_embed)
      pg_query = \
      """
        SELECT
            news_vectors.uri, lead_paragraph, web_url,
            1 - (embedding <=> %s) AS cos_sim, headline
        FROM news_vectors
        LEFT JOIN news_data ON news_vectors.uri LIKE news_data.uri
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
        uri, lead_paragraph, web_url, cos_sim, headline = r
        sources.append({
          'uri': uri,
          'lead_paragraph': lead_paragraph,
          'web_url': web_url,
          'cos_sim': cos_sim,
          'headline': headline
        })

      lead_paragraphs =  [ s['lead_paragraph'] for s in sources ]

      return {
        "sources": sources,
        "opinion": infer_opinion(opinion_request.content_to_embed, lead_paragraphs) if
          lead_paragraphs else "Unable to find sufficient sources to provide an opinion.",
      }
