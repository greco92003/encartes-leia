// Este arquivo serve apenas para que o Vercel reconheça o projeto como um projeto Node.js
// O Vercel usará o script vercel-build definido no package.json
console.log('Iniciando aplicação...');

// Exportar uma função para o Vercel
module.exports = (req, res) => {
  res.status(200).send('Aplicação iniciada com sucesso!');
};
