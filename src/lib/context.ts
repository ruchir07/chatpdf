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
        
        const queryResult = await index
        .namespace(namespace)
        .query({
            topK: 10, // Increased from 5 to 10
            vector: embeddings,
            includeMetadata: true, 
        });
        
        return queryResult.matches || []
    }
    catch(error){
        console.log("Error querying embeddings",error);
        throw error;
    }
}

export async function getContext(query: string,fileKey: string){
    
    const queryEmbeddings = await getEmbeddings(query);
    
    const matches = await getMatchesFromEmbeddings(queryEmbeddings,fileKey);    
    
    // Take all matches (up to 10)
    const finalDocs = matches;

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

    return context;
}