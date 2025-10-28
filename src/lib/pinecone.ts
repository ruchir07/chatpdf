import { Pinecone,type PineconeRecord } from "@pinecone-database/pinecone"
import { downloadFromS3 } from "./s3-server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import {Document,RecursiveCharacterTextSplitter} from "@pinecone-database/doc-splitter"
import md5 from "md5";
import { getEmbeddings } from "./embeddings";
import { convertToAscii } from "./utils";

let pinecone: Pinecone | null = null;

export const getPineconeClient = async() => {
    if(!pinecone){
        const apiKey = process.env.PINECONE_API_KEY;
        if (!apiKey) {
            throw new Error("PINECONE_API_KEY is not set");
        }
        pinecone = new Pinecone({
            apiKey: apiKey
        });
    }
    return pinecone;
}

type PDFPage = {
    pageContent: string;
    metadata: {
        loc: {pageNumber: number}
    }
}

export async function loadS3IntoPinecone(fileKey: string){

    console.log("Downloading S3 into file system");
    const file_name = await downloadFromS3(fileKey);
    if(!file_name){
        throw new Error('could not download from s3');
    }
    const loader = new PDFLoader(file_name);
    const pages = (await loader.load()) as PDFPage[];
    
    const documents = await Promise.all(pages.map(prepareDocument));

    const vectors = await Promise.all(documents.flat().map(embedDocument));

    const client = await getPineconeClient();
    const pineconeIndex = client.Index('chatpdf');

    const namespace = pineconeIndex.namespace(convertToAscii(fileKey));
    console.log("inserting vectors into pinecone");
    await namespace.upsert(vectors);
    return documents[0];

}

async function embedDocument(doc: Document){
    try{
        const embeddings = await getEmbeddings(doc.pageContent);
        const hash = md5(doc.pageContent);

        return {
            id: hash,
            values: embeddings,
            metadata: {
                text: doc.metadata.text,
                pageNumber: doc.metadata.pageNumber,
            }
        } as PineconeRecord;
    }
    catch(err){
        console.log("Error embedding documents",err);
        throw err;
    }
}

export const truncateStringByBytes = (str: string,bytes: number) => {
    const enc = new TextEncoder();
    return new TextDecoder('utf-8').decode(enc.encode(str).slice(0,bytes));
}

async function prepareDocument(page: PDFPage){

    let {pageContent,metadata} = page;
    pageContent = pageContent.replace(/\n/g,'');

    //split the docs
    const splitter = new RecursiveCharacterTextSplitter();
    const docs = await splitter.splitDocuments([
        new Document({
            pageContent,
            metadata: {
                pageNumber: metadata.loc.pageNumber,
                text: truncateStringByBytes(pageContent, 36000)
            }
        })
    ])
    return docs;

}