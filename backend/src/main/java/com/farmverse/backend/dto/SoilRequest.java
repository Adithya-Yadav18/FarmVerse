package com.farmverse.backend.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SoilRequest {

    @NotNull(message = "Farm ID is required")
    private Long farmId;

    @NotNull(message = "pH level is required")
    @DecimalMin(value = "0.0", message = "Soil pH cannot be negative (valid range: 0.0 to 14.0)")
    @DecimalMax(value = "14.0", message = "Soil pH cannot exceed 14.0 (valid range: 0.0 to 14.0)")
    private Double phLevel;

    @NotNull(message = "Moisture percentage is required")
    @DecimalMin(value = "0.0", message = "Moisture cannot be negative")
    @DecimalMax(value = "100.0", message = "Moisture cannot exceed 100%")
    private Double moisture;

    @NotNull(message = "Nitrogen percentage is required")
    @DecimalMin(value = "0.0", message = "Nitrogen cannot be negative")
    @DecimalMax(value = "100.0", message = "Nitrogen cannot exceed 100%")
    private Double nitrogen;

    @NotNull(message = "Phosphorus percentage is required")
    @DecimalMin(value = "0.0", message = "Phosphorus cannot be negative")
    @DecimalMax(value = "100.0", message = "Phosphorus cannot exceed 100%")
    private Double phosphorus;

    @NotNull(message = "Potassium percentage is required")
    @DecimalMin(value = "0.0", message = "Potassium cannot be negative")
    @DecimalMax(value = "100.0", message = "Potassium cannot exceed 100%")
    private Double potassium;

    @NotNull(message = "Organic Carbon percentage is required")
    @DecimalMin(value = "0.0", message = "Organic Carbon cannot be negative")
    @DecimalMax(value = "20.0", message = "Organic Carbon cannot exceed 20%")
    private Double organicCarbon;
}