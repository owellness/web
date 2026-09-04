export type OwtiResultRecord = {
  id: string;
  userId: string;
  domainAverages: Record<string, number>;
  typeCode: string;
  createdAt: Date;
};

export type OwtiResultInsert = Omit<OwtiResultRecord, "id" | "createdAt">;

export interface OwtiResultRepository {
  insert(input: OwtiResultInsert): Promise<OwtiResultRecord>;
  /** 최신순. */
  listByUser(userId: string, limit?: number): Promise<OwtiResultRecord[]>;
}
