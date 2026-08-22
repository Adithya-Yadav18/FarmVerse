package com.farmverse.backend.dto;

import lombok.Data;

@Data
public class FarmRequest {
    private String name; // Frontend sends "name"
    private String location;
    private Double area; // Frontend sends "area"
    private String soilType;
    private String status;
}