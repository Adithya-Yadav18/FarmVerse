package com.farmverse.backend.dto;

import lombok.Data;

@Data
public class FarmRequest {
    private String farmName;
    private String location;
    private Double totalAreaAcres;
    private String soilType;
}