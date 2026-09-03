package com.farmverse.backend.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDate;

@Data
public class CropRequest {

    @NotBlank(message = "Crop name is required")
    @Size(min = 2, max = 100, message = "Crop name must be between 2 and 100 characters")
    private String cropName;

    @NotBlank(message = "Variety is required")
    @Size(min = 1, max = 100, message = "Variety must be between 1 and 100 characters")
    private String variety;

    @NotNull(message = "Planting date is required")
    private LocalDate plantingDate;

    @NotNull(message = "Expected harvest date is required")
    private LocalDate expectedHarvestDate;

    @Pattern(regexp = "(?i)^(Planted|Growing|Flowering|Harvested|Failed)$", message = "Status must be Planted, Growing, Flowering, Harvested, or Failed")
    private String status;

    @NotNull(message = "Crop area is required")
    @Positive(message = "Crop area must be greater than 0 hectares")
    @DecimalMax(value = "100000.0", message = "Crop area cannot exceed 100,000 hectares")
    private Double area;

    private Long farmId;
}