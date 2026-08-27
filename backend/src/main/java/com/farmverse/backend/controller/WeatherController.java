package com.farmverse.backend.controller;

import com.farmverse.backend.dto.CitySuggestion;
import com.farmverse.backend.dto.WeatherResponse;
import com.farmverse.backend.service.WeatherService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/weather")
public class WeatherController {

    private final WeatherService weatherService;

    public WeatherController(WeatherService weatherService) {
        this.weatherService = weatherService;
    }

    // GET /api/weather?city=Bangalore
    @GetMapping
    public ResponseEntity<WeatherResponse> getWeather(@RequestParam String city) {
        try {
            WeatherResponse response = weatherService.getWeather(city);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    // GET /api/weather/search?q=Visakha
    @GetMapping("/search")
    public ResponseEntity<List<CitySuggestion>> searchCities(@RequestParam String q) {
        return ResponseEntity.ok(weatherService.searchCities(q));
    }
}