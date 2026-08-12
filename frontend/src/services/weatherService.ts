import api from './api';
import type { WeatherData, WeatherForecast } from '../types';

export const weatherService = {
  getCurrent: async (location: string): Promise<WeatherData> => {
    const { data } = await api.get<{ data: WeatherData }>('/weather/current', { params: { location } });
    return data.data;
  },
  getForecast: async (location: string, days = 7): Promise<WeatherForecast[]> => {
    const { data } = await api.get<{ data: WeatherForecast[] }>('/weather/forecast', { params: { location, days } });
    return data.data;
  },
  getForFarm: async (farmId: string): Promise<WeatherData> => {
    const { data } = await api.get<{ data: WeatherData }>(`/weather/farm/${farmId}`);
    return data.data;
  },
};
