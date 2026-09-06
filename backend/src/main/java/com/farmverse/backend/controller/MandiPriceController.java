package com.farmverse.backend.controller;

import com.farmverse.backend.dto.MandiPriceDTO;
import com.farmverse.backend.service.MandiPriceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mandi")
public class MandiPriceController {

    private final MandiPriceService mandiService;

    public MandiPriceController(MandiPriceService mandiService) {
        this.mandiService = mandiService;
    }

    /**
     * Get live e-NAM APMC mandi prices with optional filtering
     */
    @GetMapping("/prices")
    public ResponseEntity<List<MandiPriceDTO.MandiPriceResponse>> getPrices(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String commodity,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long farmId
    ) {
        return ResponseEntity.ok(mandiService.getPrices(category, commodity, state, search, farmId));
    }

    /**
     * Cross-Mandi Price Arbitrage Calculator
     * Computes net farmer payout after subtracting transport freight
     */
    @PostMapping("/arbitrage/calculate")
    public ResponseEntity<MandiPriceDTO.ArbitrageResponse> calculateArbitrage(
            @RequestBody MandiPriceDTO.ArbitrageRequest request
    ) {
        return ResponseEntity.ok(mandiService.calculateArbitrage(request));
    }

    /**
     * 30-Day Historical Price Progression vs Govt MSP
     */
    @GetMapping("/history/{commodity}")
    public ResponseEntity<List<MandiPriceDTO.CommodityPriceHistoryDto>> getPriceHistory(
            @PathVariable String commodity
    ) {
        return ResponseEntity.ok(mandiService.getPriceHistory(commodity));
    }

    /**
     * National Market Summary & Top Gainers/Losers
     */
    @GetMapping("/summary")
    public ResponseEntity<MandiPriceDTO.MarketSummaryStatsDto> getSummaryStats() {
        return ResponseEntity.ok(mandiService.getSummaryStats());
    }

    /**
     * Admin Trigger: Refresh e-NAM Live Data Feed
     */
    @PostMapping("/admin/sync")
    public ResponseEntity<String> syncMarketData() {
        mandiService.syncMarketData();
        return ResponseEntity.ok("e-NAM market prices synchronized successfully!");
    }
}
