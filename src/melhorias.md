# Esse PR é só um esboço da sugestão que dou

### `index.ts`
- Switch não é bom para esse fluxo de execução ao invés disso sugiro utilizar uma classe que encapsule esse comportamento, como é o caso da classe `CommandDispatcher` adicionado aqui. Isso vai te dar uma liberdade maior e um único ponto de troca sem afeta o resto do sistema, exemplo:
    1. Digamos que meu programe cresça ao ponto de ter uns 100 comandos, o switch vai ficar enorme e vai ser bem difícil ler e alterar alguma parte em específico.
    2. Digamos que eu queira colocar um comportamento diferente no dispatch, agora um !turno dispara dois commands, e um deles é utilizado em !economia, vai duplicar código.
    3. Digamos que a partir de agora eu queira inserir um DI ([InversifyJS](https://github.com/inversify/InversifyJS)). Fica difícil alterar esse switch gigante.
- Com a classe de Dispatcher nós poderemos facilmente fazer isso sem mudar o contrato, exemplo:
    1. Eu posso separar meu sistema em módulos que irá registrar os commands em seus respectivos módulo, sendo assim eu só passo o objeto do dispatcher e o módulo registra os command.
    
        `src/nasdaq/module.ts`

        ```ts
            class NasdaqModulo {
                constructor(private dispatcher: CommandDispatcher) {}
                register() {
                    this.dispatcher.register('<command1>', Command1())
                    this.dispatcher.register('<command2>', Command2())
                    this.dispatcher.register('<command3>', Command3())
                    this.dispatcher.register('<command4>', Command4())
                }
            }
        ```

        `src/bovespa/module.ts`

        ```ts
        class BovespaModulo {
                constructor(private dispatcher: CommandDispatcher) {}
                register() {
                    this.dispatcher.register('<command5>', Command5())
                    this.dispatcher.register('<command6>', Command6())
                    this.dispatcher.register('<command7>', Command7())
                    this.dispatcher.register('<command8>', Command8())
                }
            }
        ```

    2. Só mudar o dispatcher para ser um Map<string, Command[]> e ao invés de sobrescrever vc adiciona, assim não fica código duplicado.
    ```ts
        dispatcher.register('<command>', Command1())
        dispatcher.register('<command>', Command2())
    ```
    Dando até para utilizar strategy pattern para mandar o cliente definir a estratégia de como vai disparar os commands.

    3. Com essa separação dá pra facilmente colocar todos os commands no dispatcher só injetando os commands que foram colocados no DI container.

    4. Dá para implementar uma estrutura de observer para pegar eventos disparados pelos commands.

    5. Dá para implementar sistema de routeamento

- Não há estrutura de MVC nesse projeto, esses entrypoints não são controllers.
