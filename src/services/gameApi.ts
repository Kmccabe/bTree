// Dynamic API URL based on environment
const getApiUrl = () => {
  // In production (Netlify), use the Railway backend URL
  if (import.meta.env.PROD) {
    return 'https://btree-production.up.railway.app/api';
  }
  // In development, use localhost
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiUrl();

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
    console.log('🔗 Creating experiment via API:', API_BASE_URL);
    console.log('🔗 Environment:', import.meta.env.PROD ? 'PRODUCTION' : 'DEVELOPMENT');
    console.log('🔗 Experiment data:', experimentData);
    
    try {
      // First, test if the server is reachable
      console.log('🔗 Testing server health...');
      const healthResponse = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('✅ Server health check passed:', healthData);
      } else {
        console.warn('⚠️ Server health check failed:', healthResponse.status, healthResponse.statusText);
      }
    } catch (healthError) {
      console.error('❌ Server health check error:', healthError);
      throw new Error(`Cannot reach server at ${API_BASE_URL.replace('/api', '')}. Health check failed: ${healthError.message}`);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/experiments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(experimentData),
      });

      console.log('🔗 API Response status:', response.status);
      console.log('🔗 API Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}. Response: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Experiment created successfully:', result);
      return result;
    } catch (fetchError) {
      console.error('❌ Fetch error details:', {
        message: fetchError.message,
        name: fetchError.name,
        stack: fetchError.stack,
        url: `${API_BASE_URL}/experiments`
      });
      
      if (fetchError.name === 'TypeError' && fetchError.message.includes('fetch')) {
        throw new Error(`Network error: Cannot connect to ${API_BASE_URL}. Please check if the server is running and accessible.`);
      }
      
      throw fetchError;
    }
  }

  async getExperiment(experimentId: string): Promise<Experiment> {
    console.log('🔗 Getting experiment:', experimentId, 'from', API_BASE_URL);
    
    try {
      const response = await fetch(`${API_BASE_URL}/experiments/${experimentId}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Get experiment error:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}. Response: ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('❌ Get experiment error:', error);
      throw error;
    }
  }

  async joinExperiment(
    experimentId: string, 
    walletAddress: string, 
    sessionId: string
  ): Promise<{ participant: Participant; experiment: Experiment }> {
    console.log('🔗 Joining experiment via API:', API_BASE_URL);
    
    try {
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
    } catch (error) {
      console.error('❌ Join experiment error:', error);
      throw error;
    }
  }

  async createGameSession(
    gameId: string, 
    participants: { playerA?: string; playerB?: string }, 
    gameParameters: any
  ): Promise<GameSession> {
    try {
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
    } catch (error) {
      console.error('❌ Create game session error:', error);
      throw error;
    }
  }

  async getGameSession(gameId: string): Promise<GameSession> {
    try {
      const response = await fetch(`${API_BASE_URL}/games/${gameId}`);

      if (!response.ok) {
        throw new Error('Failed to get game session');
      }

      return response.json();
    } catch (error) {
      console.error('❌ Get game session error:', error);
      throw error;
    }
  }

  async updateGameState(gameId: string, updates: any): Promise<any> {
    try {
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
    } catch (error) {
      console.error('❌ Update game state error:', error);
      throw error;
    }
  }
}

export const gameAPI = new GameAPI();