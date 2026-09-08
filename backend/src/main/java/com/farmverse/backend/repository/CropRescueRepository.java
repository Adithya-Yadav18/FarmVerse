package com.farmverse.backend.repository;

import com.farmverse.backend.entity.CropRescueEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CropRescueRepository extends JpaRepository<CropRescueEntity, Long> {

    List<CropRescueEntity> findByFarmerIdOrderByTriggeredAtDesc(Long farmerId);

    List<CropRescueEntity> findByFarmIdOrderByTriggeredAtDesc(Long farmId);

    Optional<CropRescueEntity> findByTicketCode(String ticketCode);

    List<CropRescueEntity> findByStatusOrderByTriggeredAtDesc(String status);
}
