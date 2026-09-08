package com.farmverse.backend.controller;

import com.farmverse.backend.dto.ProduceBatchDTO;
import com.farmverse.backend.service.ProduceBatchService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.List;

@RestController
@RequestMapping("/api/trace")
public class ProduceBatchController {

    private final ProduceBatchService batchService;

    public ProduceBatchController(ProduceBatchService batchService) {
        this.batchService = batchService;
    }

    /**
     * Public Consumer Journey: Scan QR code or lookup batch code.
     * Increments public scan counter and returns full 5-stage lifecycle.
     */
    @GetMapping("/batch/{batchCode}")
    public ResponseEntity<ProduceBatchDTO.PublicJourneyResponse> getPublicJourney(@PathVariable String batchCode) {
        return ResponseEntity.ok(batchService.getPublicJourney(batchCode));
    }

    /**
     * Public Consumer Review: Submit rating and feedback for a batch.
     */
    @PostMapping("/batch/{batchCode}/review")
    public ResponseEntity<ProduceBatchDTO.ReviewDto> addReview(
            @PathVariable String batchCode,
            @RequestBody ProduceBatchDTO.AddReviewRequest request
    ) {
        return ResponseEntity.ok(batchService.addReview(batchCode, request));
    }

    /**
     * Public Raw QR Image stream for download or sticker printing.
     */
    @GetMapping("/batch/{batchCode}/qr-image")
    public ResponseEntity<byte[]> getQrImage(@PathVariable String batchCode) {
        ProduceBatchDTO.PublicJourneyResponse journey = batchService.getPublicJourney(batchCode);
        if (journey.getQrDataUrl() == null || !journey.getQrDataUrl().contains(",")) {
            return ResponseEntity.notFound().build();
        }
        String base64Data = journey.getQrDataUrl().split(",")[1];
        byte[] imageBytes = Base64.getDecoder().decode(base64Data);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + batchCode + "-qr.png\"")
                .contentType(MediaType.IMAGE_PNG)
                .body(imageBytes);
    }

    /**
     * Operations Dashboard: List produce batches with optional filtering.
     */
    @GetMapping("/batches")
    public ResponseEntity<List<ProduceBatchDTO.BatchResponse>> getBatches(
            @RequestParam(required = false) Long farmId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(batchService.getBatches(farmId, search, status));
    }

    /**
     * Farmer: Create a new produce batch with automatic telemetry & QR generation.
     */
    @PostMapping("/batches")
    public ResponseEntity<ProduceBatchDTO.BatchResponse> createBatch(
            @RequestBody ProduceBatchDTO.CreateBatchRequest request
    ) {
        return ResponseEntity.ok(batchService.createBatch(request));
    }

    /**
     * Agronomist: Digitally inspect & certify produce batch quality seal.
     */
    @PutMapping("/batches/{batchCode}/certify")
    public ResponseEntity<ProduceBatchDTO.BatchResponse> certifyBatch(
            @PathVariable String batchCode,
            @RequestBody ProduceBatchDTO.CertifyBatchRequest request
    ) {
        return ResponseEntity.ok(batchService.certifyBatch(batchCode, request));
    }

    /**
     * Admin / Agronomist: Flag safety recall on compromised produce lot.
     */
    @PutMapping("/batches/{batchCode}/recall")
    public ResponseEntity<ProduceBatchDTO.BatchResponse> recallBatch(
            @PathVariable String batchCode,
            @RequestBody ProduceBatchDTO.RecallBatchRequest request
    ) {
        return ResponseEntity.ok(batchService.recallBatch(batchCode, request));
    }

    /**
     * Global Traceability Summary Statistics.
     */
    @GetMapping("/stats")
    public ResponseEntity<ProduceBatchDTO.TraceabilitySummaryStatsDto> getSummaryStats() {
        return ResponseEntity.ok(batchService.getSummaryStats());
    }
}
