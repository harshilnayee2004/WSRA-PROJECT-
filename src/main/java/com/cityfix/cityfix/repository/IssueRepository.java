package com.cityfix.cityfix.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.cityfix.cityfix.entity.Issue;

public interface IssueRepository
        extends JpaRepository<Issue, Long> {

    List<Issue> findByStatusIgnoreCase(String status);

    List<Issue> findByCategoryIgnoreCase(String category);

    long countByStatusIgnoreCase(String status);
}