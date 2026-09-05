package com.farmverse.backend.controller;

import com.farmverse.backend.dto.ReportDTO;
import com.farmverse.backend.service.ReportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping
    public ResponseEntity<List<ReportDTO.ReportResponse>> getReports(
            @RequestParam(required = false) String type,
            Authentication auth
    ) {
        return ResponseEntity.ok(reportService.getReports(auth.getName(), type));
    }

    @GetMapping("/stats")
    public ResponseEntity<ReportDTO.ReportStatsResponse> getReportStats(Authentication auth) {
        return ResponseEntity.ok(reportService.getReportStats(auth.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReportDTO.ReportResponse> getReportById(@PathVariable Long id, Authentication auth) {
        var entity = reportService.getReportEntity(id, auth.getName());
        return ResponseEntity.ok(ReportDTO.ReportResponse.builder()
                .id(entity.getId())
                .reportTitle(entity.getReportTitle())
                .reportType(entity.getReportType())
                .dateRange(entity.getDateRange())
                .format(entity.getFormat())
                .fileSize(entity.getFileSize())
                .status(entity.getStatus())
                .summary(entity.getSummary())
                .downloadCount(entity.getDownloadCount())
                .generatedAt(entity.getGeneratedAt())
                .farmName(entity.getFarmName())
                .generatedByName(entity.getGeneratedByName())
                .build());
    }

    @PostMapping("/generate")
    public ResponseEntity<ReportDTO.ReportResponse> generateReport(
            @Valid @RequestBody ReportDTO.GenerateReportRequest request,
            Authentication auth
    ) {
        return ResponseEntity.ok(reportService.generateReport(auth.getName(), request));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadReport(@PathVariable Long id, Authentication auth) {
        byte[] pdfBytes = reportService.downloadReportPdf(id, auth.getName());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "FarmVerse_Report_" + id + ".pdf");
        headers.setContentLength(pdfBytes.length);

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }

    @GetMapping("/{id}/preview")
    public ResponseEntity<byte[]> previewReport(@PathVariable Long id, Authentication auth) {
        byte[] pdfBytes = reportService.previewReportPdf(id, auth.getName());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"FarmVerse_Report_" + id + ".pdf\"");
        headers.setContentLength(pdfBytes.length);

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(@PathVariable Long id, Authentication auth) {
        reportService.deleteReport(id, auth.getName());
        return ResponseEntity.noContent().build();
    }
}
