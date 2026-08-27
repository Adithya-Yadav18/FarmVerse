package com.farmverse.backend.dto;

import lombok.Data;

@Data
public class CitySuggestion {
    private String name;
    private String region;
    private String country;
    
    public String getDisplayName() {
        StringBuilder sb = new StringBuilder(name);
        if (region != null && !region.isEmpty()) sb.append(", ").append(region);
        if (country != null && !country.isEmpty()) sb.append(", ").append(country);
        return sb.toString();
    }
}