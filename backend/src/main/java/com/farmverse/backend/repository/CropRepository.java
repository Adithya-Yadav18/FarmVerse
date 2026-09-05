package com.farmverse.backend.repository;

import com.farmverse.backend.entity.Crop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface CropRepository extends JpaRepository<Crop, Long> {
    
    @Query("SELECT c FROM Crop c WHERE c.farm.id = :farmId")
    List<Crop> findByFarmId(@Param("farmId") Long farmId);

    // Custom query to find all crops for a specific user email
    @Query("SELECT c FROM Crop c WHERE c.farm.farmer.user.email = :email")
    List<Crop> findAllByFarmerEmail(@Param("email") String email);
}