"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function InputFile() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    const file = data.file[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const text = reader.result;
      try {
        const response = await fetch('/api/process-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          throw new Error('Erro ao enviar o arquivo.');
        }

        const result = await response.json();
        console.log(result.message);
      } catch (error) {
        console.error('Erro ao processar o arquivo:', error);
      }
    };

    reader.readAsText(file);
    reset();
  };

  return (
    <div className="overflow-auto w-full max-w-2xl mx-auto">
      <Label htmlFor="file">Escolha um arquivo de texto</Label>
      <form onSubmit={handleSubmit(onSubmit)} className='flex gap-2'>
        <Input id="file" type="file" {...register('file', { required: true })} />
        {errors.file && <p className="text-red-500">Arquivo é obrigatório</p>}
        <Button type="submit">Enviar</Button>
      </form>
    </div>
  );
}
