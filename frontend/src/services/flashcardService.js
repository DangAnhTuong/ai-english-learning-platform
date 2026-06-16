import api from './api';

export const flashcardService = {
  addFlashcard: async (data) => {
    const response = await api.post('/flashcards', data);
    return response.data;
  },

  getDueFlashcards: async () => {
    const response = await api.get('/flashcards/review');
    return response.data;
  },

  reviewFlashcard: async (id, quality) => {
    const response = await api.post(`/flashcards/${id}/review`, { quality });
    return response.data;
  },

  getAllFlashcards: async () => {
    const response = await api.get('/flashcards');
    return response.data;
  },

  deleteFlashcard: async (id) => {
    const response = await api.delete(`/flashcards/${id}`);
    return response.data;
  }
};

export default flashcardService;
