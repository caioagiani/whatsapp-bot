interface IResponse {
  data: IServerData;
}

interface IServerData {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
}

export { IResponse, IServerData };
