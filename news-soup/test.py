DB_CONN = "host=localhost port=5431 user=postgres" \
    " password=example_password"

from pgvector.psycopg import register_vector

import psycopg
import numpy as np
import json

with open("anti-semitism.json", "r") as f:
    js = json.load(f)

embedding = np.array(js["data"][0]["embedding"]) 

with psycopg.connect(DB_CONN) as conn:
    register_vector(conn)
    with conn.cursor() as cur:
        query = \
        """
        SELECT
            news_vectors.uri, lead_paragraph, web_url,
            1 - (embedding <=> %s) AS cos_sim, headline
        FROM news_vectors
        INNER JOIN news_data ON news_vectors.uri LIKE news_data.uri
        WHERE
            1 - (embedding <=> %s) > 0.70
        ORDER BY
            1 - (embedding <=> %s) DESC
        LIMIT
            5
        """

        cur.execute(query, (embedding, embedding, embedding))
        res = list(cur.fetchall())
        print(len(res))
        print(res)


