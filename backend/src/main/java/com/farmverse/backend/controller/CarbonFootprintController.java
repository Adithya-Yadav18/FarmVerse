package com.farmverse.backend.controller;

import com.farmverse.backend.dto.CarbonFootprintDTO;
import com.farmverse.backend.service.CarbonFootprintService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/carbon")
public class CarbonFootprintController {

    private final CarbonFootprintService carbonService;

    public CarbonFootprintController(CarbonFootprintService carbonService) {
        this.carbonService = carbonService;
    }

    @PostMapping("/audit")
    public ResponseEntity<CarbonFootprintDTO.CarbonAuditResponse> auditFarm(
            @RequestBody CarbonFootprintDTO.CarbonAuditRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(carbonService.auditFarmCarbon(request, authentication.getName()));
    }

    @GetMapping("/farms/{farmId}/latest")
    public ResponseEntity<CarbonFootprintDTO.CarbonAuditResponse> getLatestAudit(
            @PathVariable Long farmId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(carbonService.getLatestAuditForFarm(farmId, authentication.getName()));
    }

    @PostMapping("/credits/list")
    public ResponseEntity<CarbonFootprintDTO.CarbonCreditListingDto> listCredits(
            @RequestBody CarbonFootprintDTO.ListCreditsRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(carbonService.listCarbonCredits(request, authentication.getName()));
    }

    @GetMapping("/marketplace")
    public ResponseEntity<List<CarbonFootprintDTO.CarbonCreditListingDto>> getMarketplaceListings() {
        return ResponseEntity.ok(carbonService.getActiveMarketplaceListings());
    }

    @PostMapping("/credits/{id}/buy")
    public ResponseEntity<CarbonFootprintDTO.CertificateReceiptDto> buyAndRetireCredits(
            @PathVariable Long id,
            @RequestBody CarbonFootprintDTO.BuyCreditRequest request,
            Authentication authentication
    ) {
        String buyerEmail = authentication != null ? authentication.getName() : request.getBuyerEmail();
        return ResponseEntity.ok(carbonService.buyAndRetireCredits(id, request, buyerEmail));
    }
}
