export interface World {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  author: string;
  tags: string[];
  isAiGenerated: boolean;
  likes: number;
}

export interface CreateWorldParams {
  prompt: string;
  style: string;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  THINKING = 'THINKING', // Generating prompt/story
  PAINTING = 'PAINTING', // Generating image
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface WorldDraft {
  title: string;
  description: string;
  style: string;
  reasoning: string;
}