import { Pinecone } from "@pinecone-database/pinecone";

let pinecone: Pinecone | null = null;

export function getPinecone() {
  if (!pinecone) {
    const apiKey = process.env.PINECONE_DB_API_KEY;

    if (!apiKey) {
      throw new Error("PINECONE_DB_API_KEY is not configured");
    }

    pinecone = new Pinecone({
      apiKey,
    });
  }

  return pinecone;
}

export function getPineconeIndex() {
  return getPinecone().Index(
    "code-rabbit-monorepo-vector-embadding"
  );
}