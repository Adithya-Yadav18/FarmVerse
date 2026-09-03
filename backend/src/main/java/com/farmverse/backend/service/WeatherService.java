package com.farmverse.backend.service;

import com.farmverse.backend.dto.CitySuggestion;
import com.farmverse.backend.dto.WeatherResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class WeatherService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public WeatherService() {
        this.webClient = WebClient.builder().build();
        this.objectMapper = new ObjectMapper();
    }

    public WeatherResponse getWeather(String city) {
        if (city == null || city.trim().length() < 2) {
            throw new IllegalArgumentException("City name must be at least 2 characters long");
        }
        try {
            String encodedCity = java.net.URLEncoder.encode(city.trim(), java.nio.charset.StandardCharsets.UTF_8);
            // 1. Geocode the city name to get Lat/Lon
            String geoUrl = String.format("https://geocoding-api.open-meteo.com/v1/search?name=%s&count=1&language=en&format=json", encodedCity);
            JsonNode geoResponse = objectMapper.readTree(webClient.get().uri(geoUrl).retrieve().bodyToMono(String.class).block());

            if (geoResponse.path("results").isMissingNode() || geoResponse.path("results").size() == 0) {
                throw new IllegalArgumentException("City not found: " + city);
            }

            double lat = geoResponse.path("results").get(0).path("latitude").asDouble();
            double lon = geoResponse.path("results").get(0).path("longitude").asDouble();
            String cityName = geoResponse.path("results").get(0).path("name").asText();

            // 2. Fetch Weather Data (Changed to forecast_days=8 so we can skip today and show next 7)
            String forecastUrl = String.format(
                "https://api.open-meteo.com/v1/forecast?latitude=%s&longitude=%s&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&hourly=temperature_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=8",
                lat, lon
            );

            JsonNode weatherJson = objectMapper.readTree(webClient.get().uri(forecastUrl).retrieve().bodyToMono(String.class).block());

            // 3. Map to DTO
            WeatherResponse response = new WeatherResponse();
            
            // Map Current
            WeatherResponse.Current current = new WeatherResponse.Current();
            JsonNode currentNode = weatherJson.path("current");
            current.setCityName(cityName);
            current.setTemperature(currentNode.path("temperature_2m").asDouble());
            current.setFeelsLike(currentNode.path("apparent_temperature").asDouble());
            current.setHumidity(currentNode.path("relative_humidity_2m").asInt());
            current.setWindSpeed(currentNode.path("wind_speed_10m").asDouble());
            current.setWindDirection(degreesToDirection(currentNode.path("wind_direction_10m").asInt()));
            current.setPressure(currentNode.path("surface_pressure").asDouble());
            current.setPrecipitation(currentNode.path("precipitation").asDouble());
            
            int weatherCode = currentNode.path("weather_code").asInt();
            current.setDescription(getWeatherDescription(weatherCode));
            current.setEmoji(getWeatherEmoji(weatherCode));
            response.setCurrent(current);

            // Map Daily (Start from i=1 to skip today, show next 7 days)
            JsonNode dailyNode = weatherJson.path("daily");
            ArrayList<WeatherResponse.Daily> dailyList = new ArrayList<>();
            for (int i = 1; i <= 7; i++) {
                WeatherResponse.Daily day = new WeatherResponse.Daily();
                LocalDateTime date = LocalDateTime.parse(dailyNode.path("time").get(i).asText() + "T00:00:00");
                
                // Format as "Thu 28" (Day name + Day of month)
                String dayName = date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
                int dayOfMonth = date.getDayOfMonth();
                day.setDay(dayName + " " + dayOfMonth);
                
                day.setHigh(dailyNode.path("temperature_2m_max").get(i).asDouble());
                day.setLow(dailyNode.path("temperature_2m_min").get(i).asDouble());
                int dailyCode = dailyNode.path("weather_code").get(i).asInt();
                day.setCondition(getWeatherDescription(dailyCode));
                day.setEmoji(getWeatherEmoji(dailyCode));
                day.setRain(dailyNode.path("precipitation_probability_max").get(i).asInt());
                dailyList.add(day);
            }
            response.setDaily(dailyList);

            // Map Hourly (Loop 0 to 23 to get full 24 hours of today)
            JsonNode hourlyNode = weatherJson.path("hourly");
            ArrayList<WeatherResponse.Hourly> hourlyList = new ArrayList<>();
            for (int i = 0; i < 24; i++) { 
                WeatherResponse.Hourly hourObj = new WeatherResponse.Hourly();
                String timeStr = hourlyNode.path("time").get(i).asText();
                LocalDateTime hourDate = LocalDateTime.parse(timeStr);
                int h = hourDate.getHour();
                String amPm = h >= 12 ? "pm" : "am";
                int hour12 = h % 12;
                if (hour12 == 0) hour12 = 12;
                hourObj.setTime(hour12 + amPm);
                hourObj.setTemp(hourlyNode.path("temperature_2m").get(i).asDouble());
                hourlyList.add(hourObj);
            }
            response.setHourly(hourlyList);

            return response;

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to fetch weather data.");
        }
    }

    public List<CitySuggestion> searchCities(String query) {
        if (query == null || query.trim().length() < 2) return new ArrayList<>();
        
        String geoUrl = String.format("https://geocoding-api.open-meteo.com/v1/search?name=%s&count=5&language=en&format=json", query);
        
        try {
            JsonNode geoResponse = objectMapper.readTree(webClient.get().uri(geoUrl).retrieve().bodyToMono(String.class).block());
            List<CitySuggestion> list = new ArrayList<>();
            
            if (!geoResponse.path("results").isMissingNode()) {
                for (JsonNode node : geoResponse.path("results")) {
                    CitySuggestion sug = new CitySuggestion();
                    sug.setName(node.path("name").asText());
                    sug.setRegion(node.path("admin1").asText());
                    sug.setCountry(node.path("country").asText());
                    list.add(sug);
                }
            }
            return list;
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private String degreesToDirection(int degrees) {
        String[] directions = {"N", "NE", "E", "SE", "S", "SW", "W", "NW"};
        return directions[(int) Math.round(degrees / 45.0) % 8];
    }

    private String getWeatherDescription(int code) {
        if (code == 0) return "Clear sky";
        if (code >= 1 && code <= 3) return "Partly Cloudy";
        if (code >= 45 && code <= 48) return "Foggy";
        if (code >= 51 && code <= 67) return "Rainy";
        if (code >= 71 && code <= 77) return "Snow";
        if (code >= 80 && code <= 82) return "Rain Showers";
        if (code >= 85 && code <= 86) return "Snow Showers";
        if (code >= 95 && code <= 99) return "Thunderstorm";
        return "Unknown";
    }

    private String getWeatherEmoji(int code) {
        if (code == 0) return "☀️";
        if (code >= 1 && code <= 3) return "⛅";
        if (code >= 45 && code <= 48) return "🌫️";
        if (code >= 51 && code <= 67) return "🌧️";
        if (code >= 71 && code <= 77) return "❄️";
        if (code >= 80 && code <= 82) return "🌦️";
        if (code >= 85 && code <= 86) return "🌨️";
        if (code >= 95 && code <= 99) return "⛈️";
        return "🌍";
    }
}