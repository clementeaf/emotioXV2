import { Participant } from '../../../shared/interfaces/participant';
import { APIResponse } from '../../../shared/interfaces/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const registerParticipant = async (participant: Participant): Promise<APIResponse<Participant>> => {
  try {
    const response = await fetch(`${API_URL}/participants/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(participant),
    });

    const data = await response.json();
    return data;
  } catch {
    return {
      data: null,
      error: 'Error al registrar participante',
      status: 500,
    };
  }
}; 