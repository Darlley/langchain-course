import moment from 'moment';

export default function embedding() {
  const createEmbedding = async (data: FormValues, qualificationId: string) => {
    try {
      // Concatenar todos os campos relevantes
      const content = `
      data de crição: ${moment().format('D [de] MMMM [de] YYYY')}
    `.trim(); // Remove espaços desnecessários

      try {
        const response = await fetch('/api/process-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        });

        if (!response.ok) {
          throw new Error('Erro ao atualizar a qualificação.');
        }

        console.log(
          'Qualificação criada e embeddings armazenados no MongoDB Atlas.'
        );
      } catch (error) {
        console.error(
          'Erro ao criar qualificação ou armazenar embeddings:',
          error
        );
      }
    } catch (error) {
      console.error(
        'Erro ao criar qualificação ou armazenar embeddings:',
        error
      );
    }
  };

  return <div>embedding</div>;
}
