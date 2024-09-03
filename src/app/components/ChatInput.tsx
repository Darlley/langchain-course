'use client';

import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface IFormInput {
  question: string;
}

// Interface para a estrutura das mensagens
interface Message {
  question: string;
  answer: string;
}

const ChatInput = () => {
  const {
    control,
    handleSubmit,
    register,
    watch,
    reset,
    formState: { isLoading, isSubmitting, errors },
  } = useForm<IFormInput>({
    defaultValues: {
      question:
        'Agora são 16 horas das tarde de uma quarta-feira e o silvio santos morreu esta semana. Mas enfim... como fica o resultado com a alteração??',
    },
  });
  const [messages, setMessages] = useState<Message[]>([]);

  const onSubmit: SubmitHandler<IFormInput> = async (data) => {
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: data.question }),
      });

      const result = await response.json();

      console.log('front@result', result);

      if (response.ok) {
        console.log('resposta: ', result);
        // Atualiza o estado com a nova mensagem
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            question: data.question,
            answer: response.ok ? result : 'Erro ao buscar a similaridade.',
          },
        ]);
      } else {
        console.error('Erro ao buscar a similaridade:', result.error);
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            question: data.question,
            answer: 'Erro ao processar a pergunta.',
          },
        ]);
      }
    } catch (error) {
      console.error('Erro ao processar a pergunta:', error);
    }
  };

  return (
    <>
      <div className="w-full p-10 flex flex-col gap-4">
        {messages.map((message, index) => (
          <div key={index} className="max-w-2xl mx-auto flex flex-col gap-2">
            <div className="border rounded-xl bg-gray-100 p-3 text-sm max-w-full self-end">
              <p className=" break-all whitespace-pre-line text-wrap">
                {message.question}
              </p>
            </div>
            <div className="   text-sm w-full self-start">
              <p className="break-all whitespace-pre-line text-wrap">
                {message.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
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
      </form>
    </>
  );
};

export default ChatInput;
