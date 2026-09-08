package com.farmverse.backend.controller;

import com.farmverse.backend.dto.CreditScoreDTO;
import com.farmverse.backend.service.CreditScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/credit")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class CreditScoreController {

    private final CreditScoreService creditScoreService;

    @GetMapping("/score")
    public ResponseEntity<CreditScoreDTO.ScoreResponse> getCreditScore(@RequestParam(required = false) Long farmId) {
        return ResponseEntity.ok(creditScoreService.getCreditScore(farmId));
    }

    @PostMapping("/recalculate")
    public ResponseEntity<CreditScoreDTO.ScoreResponse> recalculateScore(@RequestParam(required = false) Long farmId) {
        return ResponseEntity.ok(creditScoreService.recalculateScore(farmId));
    }

    @GetMapping("/offers")
    public ResponseEntity<List<CreditScoreDTO.LoanOfferDTO>> getLoanOffers(@RequestParam(required = false) Long farmId) {
        return ResponseEntity.ok(creditScoreService.getPreApprovedOffers(farmId));
    }

    @PostMapping("/apply")
    public ResponseEntity<CreditScoreDTO.LoanApplicationResponse> applyForLoan(@RequestBody CreditScoreDTO.ApplyLoanRequest request) {
        return ResponseEntity.ok(creditScoreService.applyForLoan(request));
    }

    @GetMapping("/applications")
    public ResponseEntity<List<CreditScoreDTO.LoanApplicationResponse>> getApplications(@RequestParam(required = false) Long farmId) {
        return ResponseEntity.ok(creditScoreService.getApplications(farmId));
    }

    @PutMapping("/applications/{id}/review")
    public ResponseEntity<CreditScoreDTO.LoanApplicationResponse> reviewApplication(
            @PathVariable Long id,
            @RequestBody CreditScoreDTO.ReviewLoanRequest request,
            Principal principal) {
        String reviewer = principal != null ? principal.getName() : "Bank Underwriting Officer";
        return ResponseEntity.ok(creditScoreService.reviewApplication(id, request, reviewer));
    }

    @PostMapping("/endorse")
    public ResponseEntity<CreditScoreDTO.ScoreResponse> endorseFarm(
            @RequestParam(required = false) Long farmId,
            @RequestBody CreditScoreDTO.EndorseCreditRequest request,
            Principal principal) {
        String agronomist = principal != null ? principal.getName() : "District Agronomist";
        return ResponseEntity.ok(creditScoreService.endorseFarmCredit(farmId, agronomist, request.getAgronomistNotes()));
    }

    @PostMapping("/request-sahayak")
    public ResponseEntity<CreditScoreDTO.SahayakResponse> requestSahayak(@RequestBody CreditScoreDTO.SahayakRequest request) {
        return ResponseEntity.ok(creditScoreService.requestSahayakAssistance(request));
    }

    @GetMapping("/kendra-locator")
    public ResponseEntity<List<CreditScoreDTO.KendraCenterDTO>> getKendraCenters(@RequestParam(required = false) Long farmId) {
        return ResponseEntity.ok(creditScoreService.getKendraCenters(farmId));
    }
}
