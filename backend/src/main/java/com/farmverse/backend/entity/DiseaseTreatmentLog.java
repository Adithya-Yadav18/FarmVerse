package com.farmverse.backend.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "disease_treatment_logs")
public class DiseaseTreatmentLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disease_detection_id", nullable = false)
    @JsonIgnore
    private DiseaseDetection diseaseDetection;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime treatmentDate;

    @Column(nullable = false)
    private String treatmentName; // e.g. Mancozeb 75% WP, Copper Oxychloride, Neem Oil

    private String treatmentType; // CHEMICAL_FUNGICIDE, ORGANIC_BIOCONTROL, CULTURAL_PRUNING, NUTRITIONAL_BOOST

    private String dosage; // e.g. 2.5 g/L, 500 ml/acre

    private Double costInr; // Treatment application expense in INR

    private Integer recoveryPercentage; // 0 to 100% healing progress

    @Column(columnDefinition = "LONGTEXT")
    private String followUpImageUrl; // Follow-up leaf photo for visual progression

    @Column(columnDefinition = "TEXT")
    private String notes; // Farmer or agronomist clinical remarks

    private String appliedBy; // Name of farmer or certified agronomist

    private LocalDateTime createdAt;

    @Transient
    @JsonProperty("detectionId")
    public Long getDetectionId() {
        return diseaseDetection != null ? diseaseDetection.getId() : null;
    }
}
