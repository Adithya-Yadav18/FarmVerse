package com.farmverse.backend.dto;

import lombok.Data;

@Data
public class SoilRequest {
    private Long farmId;
    private Double phLevel;
    private Double moisture;
    private Double nitrogen;
    private Double phosphorus;
    private Double potassium;
    private Double organicCarbon;
}