# Esse PR é só um esboço da sugestão que dou

- Abstrai todos os controllers para um contrato em comum, no caso o Command
- Cada ação do sistema é um command
- Abstraí http request para uma interface onde é colocado via injeção no construtor e não mais inserida diretamente no meio do método, isso contribui na hora de fazer os test doubles, pois é facilmente possível inserir um StubHttpClient que retorna o objeto que deseja.
- Injetei repositorio de company e não pego diretamente do arquivo, ficando para o repositorio essa delegação, ficando fácil para em um futuro mude o storage, por exemplo agora meu repositorio vai pegar de uma base de dados SQL, não sendo mais necessário alterar nenhum command
- Em muitos lugares tinha a utilização errônea de `Array.prototype.map` já que não estava utilizando para o próposito de retornar um novo array e sim executar uma função para cada item e fora que tinha um if no inicio filtrando tudo, olhem a API de coleção do javascript, tem diversas funções para cada próposito que desejam, por exemplo, forEach, filter, reduce, deixei uns exemplos