import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SupabaseVectorStore } from 'langchain/vectorstores/supabase';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const { query } = await request.json();

    const embeddings = await new OpenAIEmbeddings({
      openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    }).embedQuery(query);

    const vectorStore = new SupabaseVectorStore({
      client: supabase,
      tableName: 'documents',
    });

    const nearestNeighbors = await vectorStore.similaritySearch({
      query: embeddings,
      limit: 1,
    });

    return NextResponse.json(nearestNeighbors);
  } catch (error) {
    console.error('Erro ao buscar a similaridade:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
