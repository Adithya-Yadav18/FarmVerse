package com.farmverse.backend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class CropRequest {
    private String cropName;
    private String variety;
    private LocalDate plantingDate;
    private LocalDate expectedHarvestDate;
    private String status;
    private Double area;
    private Long farmId; // Needed for Add Crop modal
}