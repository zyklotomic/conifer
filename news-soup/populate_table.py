from pgvector.psycopg import register_vector
import psycopg
import os

import json
import numpy as np

PORT=5431

def parse_embedding_file(filepath):
    with open(filepath, 'r') as f:
        vals = f.read().rstrip().split()
        nums = [float(x) for x in vals]
        arr = np.array(nums)
        arr.reshape((arr.shape[0], 1))
        return arr
        

nyt_files = ["2023-11.json", "2023-12.json"]
conn_str = f"host=localhost port={PORT} user=postgres" \
    " password=example_password"
with psycopg.connect(conn_str) as conn:
    print("Clearing table...")
    conn.execute(
        """ 
        DELETE FROM news_data WHERE true;
        DELETE FROM news_vectors WHERE true;
        """
    ) 
    conn.commit()

    print("Done. Inserting news data")
    
    uri_s = []
    for nyt_json in nyt_files:
        with open(nyt_json, 'r') as f:
            docs = json.load(f)['response']['docs']
            for d in docs:
                conn.execute(
                    """ 
                    INSERT INTO news_data
                        (uri, web_url, lead_paragraph, abstract, headline)
                    VALUES
                        (%s, %s, %s, %s, %s)
                    """,
                    (d['uri'], d['web_url'],
                        d['lead_paragraph'], d['abstract'], d['headline']['main'])
                )

                uri_s.append(d['uri'])   

    conn.commit()
    print("SUCC COMMIT news_data")

    # only embedded so far for 2023-11
    print("2023 articles to embed count: ", len(uri_s))
    register_vector(conn)
    embedded_count_ny = 0
    for i, uri in enumerate(uri_s[:474]):
        embedding_filepath = f"embeddings/embedding{i}"
        embedding = parse_embedding_file(embedding_filepath)
        if embedding.shape[0] != 768:
            print("SKIPPING EMBEDDING ", i)
            continue
        conn.execute(
            """
            INSERT INTO news_vectors
                (embedding, uri)
            VALUES
                (%s, %s)
            """, (embedding, uri)
        )
        embedded_count_ny += 1

    conn.commit()
    print("SUCC for vec embed insert, ct: ", embedded_count_ny)


    print("FOX NEWS")
    def fox_to_np(embedding): 
        embedding = embedding.split()
        arr = np.array(embedding)
        return arr
        
    fox_embed_cnt = 0
    for fox_json in os.listdir("foxnews_output"):
        with open(f"foxnews_output/{fox_json}", 'r') as f:
            docs = json.load(f)
            for i, d in enumerate(docs):
                try:
                    conn.execute(
                        """ 
                        INSERT INTO news_data
                            (uri, web_url)
                        VALUES
                            (%s, %s)
                        """,
                        (d['url'], d['url'])
                    )

                    embedding = fox_to_np(d['embedding'])
                    if embedding.shape[0] != 768:
                        print("SKIPPING EMBEDDING ", i)
                        continue

                    conn.execute(
                        """ 
                        INSERT INTO news_vectors
                            (embedding, uri)
                        VALUES
                            (%s, %s)
                        """,
                        (fox_to_np(d['embedding']), d['url'])
                    )
                    fox_embed_cnt += 1
                except psycopg.errors.UniqueViolation:
                    print(d['url'], " already exists")
                    conn.execute("ROLLBACK")

    conn.commit()
    print("FOX SUCC", fox_embed_cnt)

