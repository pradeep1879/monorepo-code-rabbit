
import { getPineconeIndex } from "@/lib/pinecone";

import { HfInference } from "@huggingface/inference";

const hf = new HfInference(
  process.env.HUGGINGFACE_API_KEY
);

export const generateEmbedding = async (
  text: string
) => {
  const embedding =
    await hf.featureExtraction({
      model:
        "BAAI/bge-base-en-v1.5",
      inputs: text,
    });

  return embedding as number[];
};


export const indexCodebase = async (
  repoId: string,
  files: { path: string; content: string }[]
) => {
      const vector: {
      id: string;
      values: number[];
      metadata: {
        repoId: string;
        path: string;
        content: string;
      };
    }[] = [];

  for (const file of files) {
    const content = `File: ${file.path}\n\n${file.content}`;
    
    const truncatedContent =
      content.slice(0, 8000);

    try {
      const embedding =
        await generateEmbedding(
          truncatedContent
        );

      console.log(
        file.path,
        embedding.length
      );

      vector.push({
        id: Buffer.from(
          `${repoId}-${file.path}`
        ).toString("base64"),

        values: embedding,

        metadata: {
          repoId,
          path: file.path,
          content: truncatedContent.slice(0, 1000),
        },
      });
    } catch (error) {
      console.error(
        `Failed to embed ${file.path}:`,
        error
      );
    }
  }

  if (vector.length > 0) {
    const batchSize = 100;

    for (let i = 0; i < vector.length; i += batchSize) {
      const batch = vector.slice(i,i + batchSize);

      try {
        const pineconeIndex = getPineconeIndex()
        await pineconeIndex.upsert({
          records: batch,
        });

        console.log(
          "Upsert success:",
          batch.length
        );
      } catch (error) {
        console.error(
          "Pinecone upsert failed:",
          error
        );
      }
    }
  }

  console.log("index complete");
};


export const retrieveContext = async (query:string, repoId:string, topK:number = 5) => {
  const embedding  = await generateEmbedding(query);

  const pineconeIndex = getPineconeIndex();

  const results = await pineconeIndex.query({
    vector: embedding,
    filter: {repoId},
    topK,
    includeMetadata: true,
  });

  return results.matches
    .map(
      (match) =>
        match.metadata?.content
    )
    .filter(
      (content): content is string =>
        typeof content === "string"
    );
}



