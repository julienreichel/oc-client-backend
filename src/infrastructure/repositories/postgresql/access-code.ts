import { Injectable } from '@nestjs/common';
import { AccessCode } from '../../../domain/entities/access-code';
import { AccessCodeRepository } from '../../../domain/entities/repositories/access-code-repository';
import { PrismaService } from '../../services/prisma.service';

@Injectable()
export class PostgreSQLAccessCodeRepository implements AccessCodeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(accessCode: AccessCode): Promise<AccessCode> {
    await this.prisma.accessCode.upsert({
      where: { code: accessCode.code },
      update: {
        documentId: accessCode.documentId,
        expiresAt: accessCode.expiresAt,
      },
      create: {
        code: accessCode.code,
        documentId: accessCode.documentId,
        expiresAt: accessCode.expiresAt,
      },
    });
    return accessCode;
  }

  async findByCode(code: string): Promise<AccessCode | null> {
    const record = await this.prisma.accessCode.findUnique({
      where: { code },
    });

    if (!record) {
      return null;
    }

    return new AccessCode(record.code, record.documentId, record.expiresAt);
  }

  async findAll(): Promise<AccessCode[]> {
    const records = await this.prisma.accessCode.findMany({
      orderBy: { expiresAt: 'asc' },
    });

    return records.map(
      (record) =>
        new AccessCode(record.code, record.documentId, record.expiresAt),
    );
  }

  async findByDocumentId(documentId: string): Promise<AccessCode[]> {
    const records = await this.prisma.accessCode.findMany({
      where: { documentId },
      orderBy: { expiresAt: 'asc' },
    });

    return records.map(
      (record) =>
        new AccessCode(record.code, record.documentId, record.expiresAt),
    );
  }

  async delete(code: string): Promise<void> {
    await this.prisma.accessCode.delete({
      where: { code },
    });
  }

  async clear(): Promise<void> {
    await this.prisma.accessCode.deleteMany({});
  }
}
