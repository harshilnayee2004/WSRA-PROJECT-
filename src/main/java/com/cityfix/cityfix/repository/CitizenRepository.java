package com.cityfix.cityfix.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.cityfix.cityfix.entity.Citizen;

public interface CitizenRepository
        extends JpaRepository<Citizen, Long> {
}