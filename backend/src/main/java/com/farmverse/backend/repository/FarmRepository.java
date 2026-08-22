package com.farmverse.backend.repository;

import com.farmverse.backend.entity.Farm;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FarmRepository extends JpaRepository<Farm, Long> {
    
    // Spring Data JPA will automatically write the SQL for this!
    // It will find all farms where the farmer_id matches the id we pass in.
    List<Farm> findByFarmerId(Long farmerId);
}