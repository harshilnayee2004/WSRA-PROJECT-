package com.cityfix.cityfix.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.cityfix.cityfix.entity.FieldOfficer;

public interface FieldOfficerRepository
        extends JpaRepository<FieldOfficer, Long> {
}