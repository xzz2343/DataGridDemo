export type PersonRole = "VP" | "Leader" | "Manager" | "IC";

export interface Person {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  office: string;
  city: string;
  state: string;
  role: PersonRole;
  title: string;
}
