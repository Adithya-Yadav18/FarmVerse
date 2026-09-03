package com.farmverse.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DiseaseScanRequest {

    @NotNull(message = "Farm selection is required")
    private Long farmId;

    private Long cropId;

    private String cropName;

    private String notes;

    private String imageUrl; // Base64 data string or image reference
}
