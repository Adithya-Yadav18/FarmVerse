package com.farmverse.backend.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FarmRequest {

    @NotBlank(message = "Farm name is required")
    @Size(min = 2, max = 100, message = "Farm name must be between 2 and 100 characters")
    private String name;

    @NotBlank(message = "Location is required")
    @Size(min = 2, max = 150, message = "Location must be between 2 and 150 characters")
    private String location;

    @NotNull(message = "Farm area is required")
    @Positive(message = "Farm area must be greater than 0 hectares")
    @DecimalMax(value = "100000.0", message = "Farm area cannot exceed 100,000 hectares")
    private Double area;

    @NotBlank(message = "Soil type is required")
    @Size(min = 2, max = 50, message = "Soil type must be between 2 and 50 characters")
    private String soilType;

    @Pattern(regexp = "(?i)^(Active|Inactive|Harvested)$", message = "Status must be Active, Inactive, or Harvested")
    private String status;
}