export type RegisteredUser = {
  id: string;
  name: string | null;
  email: string;
  providers: string[];
  createdAt: Date;
};
