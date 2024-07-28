"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts";
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const ChatInput = () => {
  const { register, handleSubmit } = useForm();
  const [answer, setAnswer] = useState('');

  const onSubmit = async (data) => {
    try {
      const openAIApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

      const standaloneQuestionTemplate = 'Given a question, convert it to a standalone question. question: {question} standalone question:';
      const standaloneQuestionPrompt = PromptTemplate.fromTemplate(standaloneQuestionTemplate);

      const llm = new ChatOpenAI({ openAIApiKey });

      const standaloneQuestionChain = standaloneQuestionPrompt.pipe(llm);

      const reformulatedQuestionResponse = await standaloneQuestionChain.invoke({
        question: data.question
      });

      console.log(reformulatedQuestionResponse.content)

      if (typeof reformulatedQuestionResponse.content !== 'string') {
        throw new Error('Resposta do modelo não é uma string.');
      }

      const reformulatedQuestion = reformulatedQuestionResponse.content;

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: reformulatedQuestion }),
      });

      const result = await response.json();

      if (response.ok) {
        setAnswer(result);
      } else {
        console.error('Erro ao buscar a similaridade:', result.error);
      }


    } catch (error) {
      console.error('Erro ao processar a pergunta:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="bg-card px-4 py-3 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <Textarea
            {...register('question', { required: true })}
            placeholder="Qual sua dúvida?"
            className="flex-1 resize-none rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            rows={1}
          />
          <Button type="submit">Enviar</Button>
        </div>
      </div>
      {answer && <p>Resposta: {JSON.stringify(answer)}</p>}
    </form>
  );
};

export default ChatInput;
