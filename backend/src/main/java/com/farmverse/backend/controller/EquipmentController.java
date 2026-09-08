package com.farmverse.backend.controller;

import com.farmverse.backend.dto.EquipmentDTO;
import com.farmverse.backend.entity.User;
import com.farmverse.backend.repository.UserRepository;
import com.farmverse.backend.service.EquipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
public class EquipmentController {

    private final EquipmentService equipmentService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<EquipmentDTO.EquipmentItemDto>> getAllEquipment(
            @RequestParam(required = false, defaultValue = "ALL") String category,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double maxDistanceKm,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(equipmentService.getAllEquipment(category, lat, lng, maxDistanceKm, search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EquipmentDTO.EquipmentItemDto> getEquipmentById(
            @PathVariable Long id,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng
    ) {
        return ResponseEntity.ok(equipmentService.getEquipmentById(id, lat, lng));
    }

    @PostMapping
    public ResponseEntity<EquipmentDTO.EquipmentItemDto> createEquipment(
            @RequestBody EquipmentDTO.CreateEquipmentRequest request,
            Authentication authentication
    ) {
        User currentUser = resolveUser(authentication);
        return ResponseEntity.ok(equipmentService.createEquipment(request, currentUser));
    }

    @PostMapping("/{id}/book")
    public ResponseEntity<EquipmentDTO.BookingDto> bookEquipment(
            @PathVariable Long id,
            @RequestBody EquipmentDTO.BookingRequest request,
            Authentication authentication
    ) {
        request.setEquipmentId(id);
        User currentUser = resolveUser(authentication);
        return ResponseEntity.ok(equipmentService.bookEquipment(request, currentUser));
    }

    @GetMapping("/bookings/my")
    public ResponseEntity<List<EquipmentDTO.BookingDto>> getMyBookings(Authentication authentication) {
        User currentUser = resolveUser(authentication);
        return ResponseEntity.ok(equipmentService.getMyBookings(currentUser));
    }

    @GetMapping("/bookings/owner")
    public ResponseEntity<List<EquipmentDTO.BookingDto>> getOwnerBookings(Authentication authentication) {
        User currentUser = resolveUser(authentication);
        return ResponseEntity.ok(equipmentService.getOwnerBookings(currentUser));
    }

    @PutMapping("/bookings/{bookingId}/status")
    public ResponseEntity<EquipmentDTO.BookingDto> updateBookingStatus(
            @PathVariable Long bookingId,
            @RequestBody EquipmentDTO.UpdateBookingStatusRequest request,
            Authentication authentication
    ) {
        User currentUser = resolveUser(authentication);
        return ResponseEntity.ok(equipmentService.updateBookingStatus(bookingId, request, currentUser));
    }

    private User resolveUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return userRepository.findAll().stream().findFirst().orElse(null);
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseGet(() -> userRepository.findAll().stream().findFirst().orElse(null));
    }
}
