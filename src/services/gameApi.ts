const API_BASE_URL = 'http://localhost:3001/api';

export interface Experiment {
  id: string;
  title: string;
  type: string;
  maxParticipants: number;
  gameParameters: {
    initialEndowment: number;
    multiplier: number;
    rounds: number;
    incrementSize: number;
    timePerDecision: number;
    roleAssignment: 'random' | 'fixed';
    showHistory: boolean;
    anonymity: boolean;
  };
  createdAt: number;
  status: string;
  participants: any[];
}

export interface Participant {
  id: string;
  sessionId: string;
  walletAddress: string;
  participantNumber: number;
  joinedAt: number;
  isReady: boolean;
  lastSeen: number;
}

export interface GameSession {
  gameId: string;
  participants: { playerA?: string; playerB?: string };
  gameParameters: any;
  gameState: any;
  createdAt: number;
  lastUpdated: number;
}

class GameAPI {
  async createExperiment(experimentData: Partial<Experiment>): Promise<{ experimentId: string; experiment: Experiment }> {
    const response = await fetch(`${API_BASE_URL}/experiments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(experimentData),
    });

    if (!response.ok) {
      throw new Error('Failed to create experiment');
    }

    return response.json();
  }

  async getExperiment(experimentId: string): Promise<Experiment> {
    const response = await fetch(`${API_BASE_URL}/experiments/${experimentId}`);

    if (!response.ok) {
      throw new Error('Failed to get experiment');
    }

    return response.json();
  }

  async joinExperiment(
    experimentId: string, 
    walletAddress: string, 
    sessionId: string
  ): Promise<{ participant: Participant; experiment: Experiment }> {
    const response = await fetch(`${API_BASE_URL}/experiments/${experimentId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ walletAddress, sessionId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to join experiment');
    }

    return response.json();
  }

  async createGameSession(
    gameId: string, 
    participants: { playerA?: string; playerB?: string }, 
    gameParameters: any
  ): Promise<GameSession> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ participants, gameParameters }),
    });

    if (!response.ok) {
      throw new Error('Failed to create game session');
    }

    return response.json();
  }

  async getGameSession(gameId: string): Promise<GameSession> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}`);

    if (!response.ok) {
      throw new Error('Failed to get game session');
    }

    return response.json();
  }

  async updateGameState(gameId: string, updates: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update game state');
    }

    return response.json();
  }
}

export const gameAPI = new GameAPI();