interface IResponse {
  data: IServerData;
}

interface IServerData {
  cep: string;
  logradouro: string;
  bairro: string;
  uf: string;
}

export { IResponse, IServerData };
