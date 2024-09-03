import { NextResponse } from 'next/server';

import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { createClient } from '@supabase/supabase-js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_PRIVATE_KEY = process.env.SUPABASE_PRIVATE_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;

export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Texto não fornecido.' },
        { status: 400 }
      );
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
      separators: ['\n\n', '\n', ' ', ''], // Configuração padrão
    });

    const output = await splitter.createDocuments([text]);

    if (!SUPABASE_PRIVATE_KEY || !SUPABASE_URL || !OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Variáveis de ambiente faltando.' },
        { status: 500 }
      );
    }

    const client = createClient(SUPABASE_URL, SUPABASE_PRIVATE_KEY);

    await SupabaseVectorStore.fromDocuments(
      output,
      new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY }),
      {
        client,
        tableName: 'documents',
      }
    );

    return NextResponse.json({
      message: 'Documento processado e armazenado com sucesso.',
    });
  } catch (err) {
    console.error('Erro ao processar o documento:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
