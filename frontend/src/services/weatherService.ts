import api from './api';

export interface CitySuggestion {
  name: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface DailyForecast {
  day: string;
  high: number;
  low: number;
  description: string;
  emoji: string;
  rainProbability: number;
}

export interface CurrentWeather {
  cityName: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  pressure: number;
  precipitation: number;
  description: string;
  emoji: string;
}

export interface WeatherResponse {
  current: CurrentWeather;
  daily: DailyForecast[];
}

export const weatherService = {
  getWeather: async (cityName: string): Promise<WeatherResponse> => {
    const { data } = await api.get<WeatherResponse>('/weather', { params: { city: cityName } });
    return data;
  },

  searchCities: async (query: string): Promise<CitySuggestion[]> => {
    const { data } = await api.get<CitySuggestion[]>('/weather/search', { params: { q: query } });
    return Array.isArray(data) ? data : [];
  },
};

export default weatherService;
