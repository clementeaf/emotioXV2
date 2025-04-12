import { PrismaClient } from '@prisma/client';
import { Participant } from '../models/participant.model';

const prisma = new PrismaClient();

export class ParticipantService {
  /**
   * Crea un nuevo participante
   */
  async create(participant: Omit<Participant, 'id'>): Promise<Participant> {
    return prisma.participant.create({
      data: participant
    });
  }

  /**
   * Obtiene un participante por su ID
   */
  async findById(id: string): Promise<Participant | null> {
    return prisma.participant.findUnique({
      where: { id }
    });
  }

  /**
   * Obtiene un participante por su email
   */
  async findByEmail(email: string): Promise<Participant | null> {
    return prisma.participant.findUnique({
      where: { email }
    });
  }

  /**
   * Obtiene todos los participantes
   */
  async findAll(): Promise<Participant[]> {
    return prisma.participant.findMany();
  }

  /**
   * Elimina un participante por su ID
   */
  async delete(id: string): Promise<Participant> {
    return prisma.participant.delete({
      where: { id }
    });
  }
}

// Exportamos una instancia única del servicio
export const participantService = new ParticipantService(); 