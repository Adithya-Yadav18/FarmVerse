package com.farmverse.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class DiseaseStatusUpdateRequest {

    @NotBlank(message = "Status cannot be blank")
    @Pattern(regexp = "(?i)^(Detected|Treating|Resolved)$", message = "Status must be Detected, Treating, or Resolved")
    private String status;
}
