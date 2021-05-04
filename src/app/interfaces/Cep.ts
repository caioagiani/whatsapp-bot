export interface IResponse {
  data: IServerData;
}

export interface IServerData {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
}
