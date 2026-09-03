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

    // Comprehensive resolution of Indian States and Territories to their primary agricultural/capital meteorological stations
    private static final java.util.Map<String, String[]> REGION_RESOLUTION_MAP = new java.util.HashMap<>();
    static {
        REGION_RESOLUTION_MAP.put("tamilnadu", new String[]{"Chennai", "Tamil Nadu"});
        REGION_RESOLUTION_MAP.put("tamil nadu", new String[]{"Chennai", "Tamil Nadu"});
        REGION_RESOLUTION_MAP.put("karnataka", new String[]{"Bengaluru", "Karnataka"});
        REGION_RESOLUTION_MAP.put("maharashtra", new String[]{"Mumbai", "Maharashtra"});
        REGION_RESOLUTION_MAP.put("andhrapradesh", new String[]{"Visakhapatnam", "Andhra Pradesh"});
        REGION_RESOLUTION_MAP.put("andhra pradesh", new String[]{"Visakhapatnam", "Andhra Pradesh"});
        REGION_RESOLUTION_MAP.put("telangana", new String[]{"Hyderabad", "Telangana"});
        REGION_RESOLUTION_MAP.put("kerala", new String[]{"Kochi", "Kerala"});
        REGION_RESOLUTION_MAP.put("punjab", new String[]{"Ludhiana", "Punjab"});
        REGION_RESOLUTION_MAP.put("haryana", new String[]{"Gurugram", "Haryana"});
        REGION_RESOLUTION_MAP.put("delhi", new String[]{"New Delhi", "Delhi NCR"});
        REGION_RESOLUTION_MAP.put("newdelhi", new String[]{"New Delhi", "New Delhi"});
        REGION_RESOLUTION_MAP.put("uttarpradesh", new String[]{"Lucknow", "Uttar Pradesh"});
        REGION_RESOLUTION_MAP.put("uttar pradesh", new String[]{"Lucknow", "Uttar Pradesh"});
        REGION_RESOLUTION_MAP.put("madhyapradesh", new String[]{"Bhopal", "Madhya Pradesh"});
        REGION_RESOLUTION_MAP.put("madhya pradesh", new String[]{"Bhopal", "Madhya Pradesh"});
        REGION_RESOLUTION_MAP.put("rajasthan", new String[]{"Jaipur", "Rajasthan"});
        REGION_RESOLUTION_MAP.put("gujarat", new String[]{"Ahmedabad", "Gujarat"});
        REGION_RESOLUTION_MAP.put("westbengal", new String[]{"Kolkata", "West Bengal"});
        REGION_RESOLUTION_MAP.put("west bengal", new String[]{"Kolkata", "West Bengal"});
        REGION_RESOLUTION_MAP.put("bihar", new String[]{"Patna", "Bihar"});
        REGION_RESOLUTION_MAP.put("odisha", new String[]{"Bhubaneswar", "Odisha"});
        REGION_RESOLUTION_MAP.put("orissa", new String[]{"Bhubaneswar", "Odisha"});
        REGION_RESOLUTION_MAP.put("assam", new String[]{"Guwahati", "Assam"});
        REGION_RESOLUTION_MAP.put("goa", new String[]{"Panaji", "Goa"});
        REGION_RESOLUTION_MAP.put("himachalpradesh", new String[]{"Shimla", "Himachal Pradesh"});
        REGION_RESOLUTION_MAP.put("himachal pradesh", new String[]{"Shimla", "Himachal Pradesh"});
        REGION_RESOLUTION_MAP.put("uttarakhand", new String[]{"Dehradun", "Uttarakhand"});
        REGION_RESOLUTION_MAP.put("jharkhand", new String[]{"Ranchi", "Jharkhand"});
        REGION_RESOLUTION_MAP.put("chhattisgarh", new String[]{"Raipur", "Chhattisgarh"});
        REGION_RESOLUTION_MAP.put("jammu and kashmir", new String[]{"Srinagar", "Jammu & Kashmir"});
        REGION_RESOLUTION_MAP.put("jammukashmir", new String[]{"Srinagar", "Jammu & Kashmir"});
        REGION_RESOLUTION_MAP.put("kashmir", new String[]{"Srinagar", "Kashmir"});
        REGION_RESOLUTION_MAP.put("tripura", new String[]{"Agartala", "Tripura"});
        REGION_RESOLUTION_MAP.put("meghalaya", new String[]{"Shillong", "Meghalaya"});
        REGION_RESOLUTION_MAP.put("manipur", new String[]{"Imphal", "Manipur"});
        REGION_RESOLUTION_MAP.put("nagaland", new String[]{"Kohima", "Nagaland"});
        REGION_RESOLUTION_MAP.put("mizoram", new String[]{"Aizawl", "Mizoram"});
        REGION_RESOLUTION_MAP.put("arunachalpradesh", new String[]{"Itanagar", "Arunachal Pradesh"});
        REGION_RESOLUTION_MAP.put("arunachal pradesh", new String[]{"Itanagar", "Arunachal Pradesh"});
        REGION_RESOLUTION_MAP.put("sikkim", new String[]{"Gangtok", "Sikkim"});
        REGION_RESOLUTION_MAP.put("ladakh", new String[]{"Leh", "Ladakh"});
        REGION_RESOLUTION_MAP.put("puducherry", new String[]{"Puducherry", "Puducherry"});
    }

    public WeatherService() {
        this.webClient = WebClient.builder().build();
        this.objectMapper = new ObjectMapper();
    }

    public WeatherResponse getWeather(String city) {
        if (city == null || city.trim().length() < 2) {
            throw new IllegalArgumentException("City or state name must be at least 2 characters long");
        }
        try {
            // Extract primary location if comma-separated e.g. "Salem, Tamil Nadu"
            String primaryCity = city.trim();
            if (primaryCity.contains(",")) {
                primaryCity = primaryCity.split(",")[0].trim();
            }

            // Check if user entered an Indian State or Territory
            String normalizedKey = primaryCity.toLowerCase().replaceAll("[^a-z0-9]", "");
            String queryForGeocoding = primaryCity;
            String overrideDisplayName = null;

            if (REGION_RESOLUTION_MAP.containsKey(normalizedKey)) {
                String[] resolved = REGION_RESOLUTION_MAP.get(normalizedKey);
                queryForGeocoding = resolved[0]; // Hub city
                overrideDisplayName = resolved[1]; // State display name
            }

            String encodedCity = java.net.URLEncoder.encode(queryForGeocoding, java.nio.charset.StandardCharsets.UTF_8);
            // 1. Geocode the city name (request top 10 to prioritize Indian regions)
            String geoUrl = String.format("https://geocoding-api.open-meteo.com/v1/search?name=%s&count=10&language=en&format=json", encodedCity);
            JsonNode geoResponse = objectMapper.readTree(webClient.get().uri(geoUrl).retrieve().bodyToMono(String.class).block());

            JsonNode results = geoResponse.path("results");
            if (results.isMissingNode() || results.size() == 0) {
                // Fallback attempt with full encoded query
                String fallbackUrl = String.format("https://geocoding-api.open-meteo.com/v1/search?name=%s&count=10&language=en&format=json",
                        java.net.URLEncoder.encode(city.trim(), java.nio.charset.StandardCharsets.UTF_8));
                geoResponse = objectMapper.readTree(webClient.get().uri(fallbackUrl).retrieve().bodyToMono(String.class).block());
                results = geoResponse.path("results");
                if (results.isMissingNode() || results.size() == 0) {
                    throw new IllegalArgumentException("Location not found: " + city + ". Try searching with a nearby city or district.");
                }
            }

            // Prefer Indian location if available, otherwise take first result
            JsonNode selectedNode = results.get(0);
            for (JsonNode node : results) {
                String countryCode = node.path("country_code").asText("");
                String country = node.path("country").asText("");
                if ("IN".equalsIgnoreCase(countryCode) || "India".equalsIgnoreCase(country)) {
                    selectedNode = node;
                    break;
                }
            }

            double lat = selectedNode.path("latitude").asDouble();
            double lon = selectedNode.path("longitude").asDouble();
            String cityName = overrideDisplayName != null ? overrideDisplayName : selectedNode.path("name").asText();

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

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to fetch weather data: " + e.getMessage());
        }
    }

    public List<CitySuggestion> searchCities(String query) {
        if (query == null || query.trim().length() < 2) return new ArrayList<>();

        String geoUrl = String.format("https://geocoding-api.open-meteo.com/v1/search?name=%s&count=10&language=en&format=json",
                java.net.URLEncoder.encode(query.trim(), java.nio.charset.StandardCharsets.UTF_8));

        try {
            JsonNode geoResponse = objectMapper.readTree(webClient.get().uri(geoUrl).retrieve().bodyToMono(String.class).block());
            List<CitySuggestion> indianList = new ArrayList<>();
            List<CitySuggestion> otherList = new ArrayList<>();

            // Prepend matching Indian State/Territory if query matches
            String qLower = query.toLowerCase().trim().replaceAll("[^a-z0-9]", "");
            for (java.util.Map.Entry<String, String[]> entry : REGION_RESOLUTION_MAP.entrySet()) {
                if (entry.getKey().contains(qLower) || (qLower.length() >= 3 && entry.getKey().startsWith(qLower))) {
                    CitySuggestion stateSug = new CitySuggestion();
                    stateSug.setName(entry.getValue()[1]);
                    stateSug.setRegion(entry.getValue()[0] + " Hub");
                    stateSug.setCountry("India");
                    indianList.add(stateSug);
                    break;
                }
            }

            if (!geoResponse.path("results").isMissingNode()) {
                for (JsonNode node : geoResponse.path("results")) {
                    CitySuggestion sug = new CitySuggestion();
                    sug.setName(node.path("name").asText());
                    sug.setRegion(node.path("admin1").asText());
                    sug.setCountry(node.path("country").asText());
                    String countryCode = node.path("country_code").asText("");

                    if ("IN".equalsIgnoreCase(countryCode) || "India".equalsIgnoreCase(sug.getCountry())) {
                        indianList.add(sug);
                    } else {
                        otherList.add(sug);
                    }
                }
            }
            // Combine: Indian cities first, then others
            indianList.addAll(otherList);
            return indianList.size() > 6 ? indianList.subList(0, 6) : indianList;
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