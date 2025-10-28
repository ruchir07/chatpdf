import { Pinecone } from "@pinecone-database/pinecone";
import { convertToAscii } from "./utils";
import { getEmbeddings } from "./embeddings";
import { match } from "assert";

export async function getMatchesFromEmbeddings(embeddings:number[],fileKey: string){
    try {
        // Initialize Pinecone with API key
        const apiKey = process.env.PINECONE_API_KEY;
        if (!apiKey) {
            throw new Error("PINECONE_API_KEY is not set");
        }
        
        const pinecone = new Pinecone({
            apiKey: apiKey
        });
        const index = await pinecone.Index('chatpdf');

        const namespace = convertToAscii(fileKey);
        console.log("Querying Pinecone with namespace:", namespace);
        
        const queryResult = await index
        .namespace(namespace)
        .query({
            topK: 10, // Increased from 5 to 10
            vector: embeddings,
            includeMetadata: true, 
        });
        
        console.log("Query results:", queryResult.matches?.length || 0, "matches");
        if (queryResult.matches) {
            console.log("Top match score:", queryResult.matches[0]?.score);
            console.log("Match IDs:", queryResult.matches.slice(0, 3).map(m => m.id));
        }
        return queryResult.matches || []
    }
    catch(error){
        console.log("Error querying embeddings",error);
        throw error;
    }
}

export async function getContext(query: string,fileKey: string){
    console.log("Getting context for query:", query);
    console.log("File key:", fileKey);
    
    const queryEmbeddings = await getEmbeddings(query);
    console.log("Generated embeddings, length:", queryEmbeddings.length);
    
    const matches = await getMatchesFromEmbeddings(queryEmbeddings,fileKey);
    console.log("Found matches:", matches.length);
    
    if (matches.length > 0) {
        console.log("Match scores:", matches.map(m => m.score));
    }

    // Accept ANY matches (no threshold filtering)
    console.log("All match scores:", matches.map(m => `${m.score?.toFixed(3)} - ${(m.metadata as any)?.pageNumber || '?'}`));
    
    // Take all matches (up to 10)
    const finalDocs = matches;
    console.log("Final docs to use:", finalDocs.length);

    type Metadata = {
        text: string,
        pageNumber: number
    }

    let docs = finalDocs.map((match) => {
        const metadata = match.metadata as Metadata;
        const pageInfo = metadata.pageNumber ? `[Page ${metadata.pageNumber}]` : '';
        return `${pageInfo}\n${metadata.text}`;
    });
    const context = docs.join('\n\n--- PAGE BREAK ---\n\n').substring(0, 10000); // Increased to 10000 chars
    console.log("Context length:", context.length);
    console.log("Context preview:", context.substring(0, 300));
    return context;
}