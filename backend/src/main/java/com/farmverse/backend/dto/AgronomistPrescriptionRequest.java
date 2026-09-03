package com.farmverse.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AgronomistPrescriptionRequest {

    @NotBlank(message = "Confirmed disease diagnosis is required")
    private String confirmedDisease;

    private String severity; // Low, Medium, High, Critical

    @NotBlank(message = "Official prescription and dosage protocol is required")
    private String prescription;

    private String clinicalNotes;
}
