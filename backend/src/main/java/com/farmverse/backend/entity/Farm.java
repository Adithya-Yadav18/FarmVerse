package com.farmverse.backend.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

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

    @JsonProperty("name")
    private String farmName;
    
    private String location;
    
    @JsonProperty("area")
    private Double totalAreaAcres;
    
    private String soilType;
    
    private String status = "Active";
    
    @JsonProperty("areaUnit")
    private String areaUnit = "hectares";

    private Double latitude;
    private Double longitude;

    // NEW: Link to the Crop table (One Farm has Many Crops)
    @OneToMany(mappedBy = "farm", fetch = jakarta.persistence.FetchType.EAGER)
    private List<Crop> cropEntities = new ArrayList<>();

    // NEW: Convert the Crop objects into a simple list of Strings for the frontend
    @Transient
    @JsonProperty("crops")
    public List<String> getCropNames() {
        if (cropEntities != null && !cropEntities.isEmpty()) {
            return cropEntities.stream()
                               .map(Crop::getCropName)
                               .collect(Collectors.toList());
        }
        return new ArrayList<>();
    }
    
    private LocalDateTime createdAt;
}