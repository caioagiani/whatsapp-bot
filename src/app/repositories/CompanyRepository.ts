import { company } from "../../config/integrantes.json";

interface Company {
  admin: boolean;
  cargo: string;
  nome: string;
  numero: string;
  ramal: string;
  inicio: number;
  pausa: number;
  fim: number;
  expediente: boolean;
}

export default class CompanyRepository {
  async findCompanies(): Promise<Company[]> {
    return company;
  }
  async findByPhoneNumber(phoneNumber: string): Promise<Company[]> {
    return (await this.findCompanies()).filter(
      (value) => value.numero == phoneNumber,
    );
  }
}
