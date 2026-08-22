package com.farmverse.backend.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "farms")
public class Farm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "farmer_id", nullable = false)
    private Farmer farmer;

    @JsonProperty("name") // Send as "name" to frontend
    private String farmName;
    
    private String location;
    
    @JsonProperty("area") // Send as "area" to frontend
    private Double totalAreaAcres;
    
    private String soilType;
    
    private String status = "Active"; // NEW: Default status
    
    @JsonProperty("areaUnit")
    private String areaUnit = "hectares"; // NEW: Default unit

    // Frontend expects an array of crops, so we send an empty list for now until Module 4 is built
    @Transient
    @JsonProperty("crops")
    private List<String> crops = new ArrayList<>();
    
    private LocalDateTime createdAt;
}