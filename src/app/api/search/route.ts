import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import {
  RunnablePassthrough,
  RunnableSequence,
} from '@langchain/core/runnables';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_PRIVATE_KEY = process.env.SUPABASE_PRIVATE_KEY!;
const SUPABASE_URL = process.env.SUPABASE_URL!;

const embeddings = new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY });
const client = createClient(SUPABASE_URL, SUPABASE_PRIVATE_KEY);

const llm = new ChatOpenAI({
  apiKey: OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Consulta vazia.' }, { status: 400 });
    }

    // Cria um VectorStore com Supabase para armazenar e recuperar documentos baseados em embeddings.
    const vectorStore = new SupabaseVectorStore(embeddings, {
      client,
      tableName: 'documents',
      queryName: 'match_documents',
    });

    // Define o retriever para recuperar documentos relevantes do VectorStore.
    const retriever = vectorStore.asRetriever();

    // Cria um template de prompt para gerar uma pergunta independente (standalone question).
    const standaloneQuestionTemplate = `Dada uma pergunta, converta-a em uma pergunta independente curta e objetiva. 
    Pergunta: {question} 
    Pergunta independente:`;

    const standaloneQuestionPrompt = PromptTemplate.fromTemplate(
      standaloneQuestionTemplate
    );

    // Cria um template de prompt para gerar a resposta final baseada no contexto recuperado.
    const answerTemplate = `Responda a uma determinada pergunta sobre contexto. Sempre fale como se estivesse conversando com um amigo.
    context: {context}
    question: {question}
    answer: `;
    const answerPrompt = PromptTemplate.fromTemplate(answerTemplate);

    // Cadeia de execução para transformar a pergunta original em uma pergunta independente (standalone question).
    const standaloneQuestionChain = standaloneQuestionPrompt
      .pipe(llm)
      .pipe(new StringOutputParser());

    // Cadeia de execução para recuperar documentos relevantes usando a pergunta independente.
    const retrieverChain = RunnableSequence.from([
      (prev) => prev.standalone_question, // Usa a pergunta independente gerada na etapa anterior.
      retriever, // Recupera os documentos relevantes do VectorStore.
      (docs) => docs?.map((doc: { pageContent: string }) => doc.pageContent).join('\n\n'), // Combina o conteúdo dos documentos recuperados.
    ]);

    // Cadeia de execução para gerar a resposta final usando os documentos recuperados e a pergunta original.
    const answerChain = answerPrompt.pipe(llm).pipe(new StringOutputParser());

    // Sequência completa de execução que combina todas as etapas anteriores.
    const chain = RunnableSequence.from([
      {
        standalone_question: standaloneQuestionChain, // Gera a pergunta independente.
        original_input: new RunnablePassthrough(), // Mantém a pergunta original.
      },
      {
        context: retrieverChain, // Usa a pergunta independente para recuperar o contexto (documentos).
        question: ({ original_input }) => original_input.question, // Usa a pergunta original para gerar a resposta.
      },
      answerChain, // Gera a resposta final.
    ]);

    // Executa a cadeia de execução com a pergunta do usuário.
    const response = await chain.invoke({
      question: query,
    });

    // Retorna a resposta final ao usuário.
    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro ao buscar a similaridade:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
