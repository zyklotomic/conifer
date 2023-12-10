CREATE EXTENSION vector;
CREATE TABLE news_vectors (
    embedding vector(768), uri text
);
CREATE TABLE news_data (
    uri text PRIMARY KEY, web_url text,
    lead_paragraph text, abstract text, headline text
);
