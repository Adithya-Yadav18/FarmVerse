package com.farmverse.backend.repository;

import com.farmverse.backend.entity.Farm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface FarmRepository extends JpaRepository<Farm, Long> {
    
    List<Farm> findByFarmerId(Long farmerId);

    @Query("SELECT f FROM Farm f WHERE f.farmer.user.email = :email")
    List<Farm> findByFarmerUserEmail(@Param("email") String email);
}