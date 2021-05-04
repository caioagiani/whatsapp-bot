<p align="center">
  <img width="100" height="80%" src=".github/assets/logo.png" alt="WhatsApp BOT @caioagiani"></a>
</p>

<h3 align="center">Bot WhatsApp - NodeJS TypeScript</h3>

<p align="center">
  <img alt="GitHub count language" src="https://img.shields.io/github/languages/count/caioagiani/whatsapp-bot">
  <img alt="GitHub top language" src="https://img.shields.io/github/languages/top/caioagiani/whatsapp-bot">
  <img alt="GitHub repo size" src="https://img.shields.io/github/repo-size/caioagiani/whatsapp-bot">
  <img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/caioagiani/whatsapp-bot">
</p>

## ✌ Apresentação:

Esta aplicação é um Client que simula a conexão com WhatsApp Web através do **Puppeteer**, instanciando em tempo real a conexão.

## ▶ Instalação:

```bash
# Baixar projeto
$ git clone git@github.com:caioagiani/whatsapp-bot.git

# Instalar TypeScript Global
$ npm i -g typescript

# Configurar .env para envio de SMS
$ cp .env.example .env

# Instalar dependências
$ yarn install ou npm install

# Iniciar aplicação
$ yarn dev ou npm run dev
```

Caso dê algum erro com a depedência Puppeteer, utilize: `sudo npm install -g puppeteer --unsafe-perm=true`

Após configuração, necessário atrelar aplicação ao seu WhatsApp, para isso, basta escanear o QR Code em seu terminal.
<br/><br/>

## 🔰 Comandos

- !cotacao
- !company
- !turno
- !pausa
- !encerrar
- !mencionar
- !cep 01407100
- !perfil @contato
- !sms @contato

Digite: `!sms contato` para enviar um breve SMS:

Necessário registrar a conta no site abaixo para obter sua key: [mobizon.com.br](https://mobizon.com.br)

<img width="600" height="100%" src="https://i.imgur.com/RZCxqkY.png" alt="Enviar SMS">

Digite: `!perfil <@contato>` para baixar a foto avatar:

<img width="600" height="100%" src="https://i.imgur.com/wLrW7yE.png" alt="Perfil">

---

Digite: `!cotacao` e o Bot consumirá a <a href="https://docs.awesomeapi.com.br/">API</a> de cotação das seguintes moedas: (BTC, DOLAR, EURO):

<img width="600" height="100%" src="https://i.imgur.com/qrqWQ6N.png" alt="Cotação da moeda">

---

Digite: `!turno` e o Bot consumirá uma API própria:

<img width="600" height="100%" src="https://i.imgur.com/XtZA3ha.png" alt="Passagem de turno">

Comando **!turno** é de uso exclusivo, não funcionará para uso público, isso foi apenas uma demonstração.

---

Digite: `!encerrar` e o Bot encerra o seu expediente de acordo com seu horário:

<img width="600" height="100%" src="https://i.imgur.com/EL9l6UN.png" alt="Encerrar jornada">

---

Digite: `!pausa` e o Bot enviará uma mensagem com o tempo que você deverá retornar:

<img width="600" height="100%" src="https://i.imgur.com/0xIpYYw.png" alt="Pausa jornada">

---

Digite: `!mencionar` para marcar todos os integrantes do grupo:

<img width="600" height="100%" src="https://i.imgur.com/yvJbqNA.png" alt="Mencionar">

---

Digite: `!cep <cep>` para consultar o cep:

<img width="600" height="100%" src="https://i.imgur.com/GXV02qi.png" alt="Consulta CEP">

## Isenção de Responsabilidade

Este projeto não é afiliado, associado, autorizado, endossado por, ou de qualquer forma oficialmente conectado com o WhatsApp ou qualquer uma de suas subsidiárias ou suas afiliadas. O site oficial do WhatsApp pode ser encontrado em https://whatsapp.com. "WhatsApp" bem como nomes, marcas, emblemas e imagens relacionadas são marcas registradas de seus respectivos proprietários.

## Agradecimentos e Créditos

- [@pedroslopez](https://github.com/pedroslopez)
- [@raniellyferreira](https://github.com/raniellyferreira)

## Contato

- [LinkedIn](https://www.linkedin.com/in/caioagiani/)
- caio.agiani14@gmail.com
