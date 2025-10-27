import { pipeline } from '@xenova/transformers';

let embedder: any = null;

// Load the embedding model only once
async function loadModel() {
  if (!embedder) {
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedder;
}

export async function getEmbeddings(text: string): Promise<number[]> {
  try {
    const model = await loadModel();

    const embeddings = await model(text.replace(/\n/g, ' '), {
      pooling: 'mean',        // average all token embeddings
      normalize: true         // recommended for vector DB like Pinecone
    });

    return Array.from(embeddings.data); // return as number[]
  } catch (err) {
    console.error('Error generating embeddings:', err);
    throw err;
  }
}
