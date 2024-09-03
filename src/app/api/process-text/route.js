import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OpenAIEmbeddings } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL;

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    console.log('post embedding', content);

    if (!content) {
      return NextResponse.json(
        { error: 'Conteúdo vazio para embeddings.' },
        { status: 400 }
      );
    }

    // Divide o texto em chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
      separators: ['\n\n', '\n', ' ', ''],
    });

    const documents = await splitter.createDocuments([content]);

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Chave API do OpenAI faltando.' },
        { status: 500 }
      );
    }

    // Configuração do embeddings com o modelo correto
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: OPENAI_API_KEY,
      model: OPENAI_EMBEDDING_MODEL,
    });

    const supabaseClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PRIVATE_KEY!
    );

    // Armazena os embeddings no Supabase
    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabaseClient,
      tableName: 'documents', // Certifique-se que esta tabela existe e está configurada corretamente
      queryName: 'match_documents', // Nome da função de correspondência no Supabase
    });

    await vectorStore.addDocuments(documents);

    return NextResponse.json({
      message: 'Processado e armazenado com sucesso.',
    });
  } catch (err) {
    console.error('Erro ao processar a qualificação:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}