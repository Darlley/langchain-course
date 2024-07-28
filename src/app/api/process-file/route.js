import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { createClient } from '@supabase/supabase-js';
import { SupabaseVectorStore } from 'langchain/vectorstores/supabase';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Texto não fornecido.' }, { status: 400 });
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
      separators: ['\n\n', '\n', ' ', ''], // Configuração padrão
    });

    const output = await splitter.createDocuments([text]);

    const sbApiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const openAIApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

    if (!sbApiKey || !sbUrl || !openAIApiKey) {
      return NextResponse.json({ error: 'Variáveis de ambiente faltando.' }, { status: 500 });
    }

    const client = createClient(sbUrl, sbApiKey);

    await SupabaseVectorStore.fromDocuments(
      output,
      new OpenAIEmbeddings({ openAIApiKey }),
      {
        client,
        tableName: 'documents',
      }
    );

    return NextResponse.json({ message: 'Documento processado e armazenado com sucesso.' });
  } catch (err) {
    console.error('Erro ao processar o documento:', err);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
