package com.farmverse.backend.repository;

import com.farmverse.backend.entity.SoilData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface SoilDataRepository extends JpaRepository<SoilData, Long> {
    
    List<SoilData> findByFarmId(Long farmId);

    @Query("SELECT s FROM SoilData s WHERE s.farm.farmer.user.email = :email")
    List<SoilData> findAllByFarmerEmail(@Param("email") String email);
}