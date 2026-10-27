package com.cityfix.cityfix.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.cityfix.cityfix.entity.Issue;
import com.cityfix.cityfix.entity.IssueHistory;

import com.cityfix.cityfix.repository.IssueRepository;
import com.cityfix.cityfix.repository.IssueHistoryRepository;
import com.cityfix.cityfix.repository.CitizenRepository;
import com.cityfix.cityfix.repository.FieldOfficerRepository;

@RestController
@RequestMapping("/api/issues")
public class IssueController {

    private final IssueRepository issueRepository;
    private final IssueHistoryRepository historyRepository;
    private final CitizenRepository citizenRepository;
    private final FieldOfficerRepository officerRepository;

    public IssueController(
            IssueRepository issueRepository,
            IssueHistoryRepository historyRepository,
            CitizenRepository citizenRepository,
            FieldOfficerRepository officerRepository) {

        this.issueRepository = issueRepository;
        this.historyRepository = historyRepository;
        this.citizenRepository = citizenRepository;
        this.officerRepository = officerRepository;
    }

    @PostMapping
    public ResponseEntity<?> create(
            @RequestBody Issue issue) {

        if (issue.getCitizenId() == null
                || !citizenRepository.existsById(
                        issue.getCitizenId())) {

            return ResponseEntity.badRequest()
                    .body("A valid citizenId is required.");
        }

        issue.setId(null);
        issue.setAssignedOfficerId(null);
        issue.setStatus("SUBMITTED");

        Issue saved = issueRepository.save(issue);

        saveHistory(
                saved.getId(),
                null,
                "SUBMITTED",
                "Issue submitted");

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(saved);
    }

    @GetMapping
    public List<Issue> getAll() {
        return issueRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Issue> getById(
            @PathVariable Long id) {

        return issueRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody Issue updated) {

        Issue existing =
                issueRepository.findById(id).orElse(null);

        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        if (updated.getCitizenId() != null
                && !citizenRepository.existsById(
                        updated.getCitizenId())) {

            return ResponseEntity.badRequest()
                    .body("The supplied citizenId does not exist.");
        }

        if (updated.getCitizenId() != null) {
            existing.setCitizenId(updated.getCitizenId());
        }

        existing.setTitle(updated.getTitle());
        existing.setDescription(updated.getDescription());
        existing.setCategory(updated.getCategory());
        existing.setLocation(updated.getLocation());

        if (updated.getPriority() != null) {
            existing.setPriority(updated.getPriority());
        }

        return ResponseEntity.ok(
                issueRepository.save(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id) {

        if (!issueRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        List<IssueHistory> history =
                historyRepository
                        .findByIssueIdOrderByChangedAtDesc(id);

        historyRepository.deleteAll(history);
        issueRepository.deleteById(id);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/status/{status}")
    public List<Issue> getByStatus(
            @PathVariable String status) {

        return issueRepository
                .findByStatusIgnoreCase(status);
    }

    @GetMapping("/category/{category}")
    public List<Issue> getByCategory(
            @PathVariable String category) {

        return issueRepository
                .findByCategoryIgnoreCase(category);
    }

    @PutMapping("/{id}/assign/{officerId}")
    public ResponseEntity<?> assignOfficer(
            @PathVariable Long id,
            @PathVariable Long officerId) {

        Issue issue =
                issueRepository.findById(id).orElse(null);

        if (issue == null) {
            return ResponseEntity.notFound().build();
        }

        if (!officerRepository.existsById(officerId)) {
            return ResponseEntity.badRequest()
                    .body("The supplied officerId does not exist.");
        }

        issue.setAssignedOfficerId(officerId);

        if ("SUBMITTED".equalsIgnoreCase(issue.getStatus())) {
            String oldStatus = issue.getStatus();
            issue.setStatus("ASSIGNED");

            saveHistory(
                    id,
                    oldStatus,
                    "ASSIGNED",
                    "Officer assigned");
        }

        return ResponseEntity.ok(
                issueRepository.save(issue));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String remarks) {

        Issue issue =
                issueRepository.findById(id).orElse(null);

        if (issue == null) {
            return ResponseEntity.notFound().build();
        }

        String newStatus = status.trim().toUpperCase();

        if (!List.of(
                "SUBMITTED",
                "ASSIGNED",
                "IN_PROGRESS",
                "RESOLVED",
                "CLOSED").contains(newStatus)) {

            return ResponseEntity.badRequest().body(
                    "Invalid status. Use SUBMITTED, ASSIGNED, "
                    + "IN_PROGRESS, RESOLVED or CLOSED.");
        }

        String oldStatus = issue.getStatus();
        issue.setStatus(newStatus);

        Issue saved = issueRepository.save(issue);

        if (oldStatus == null
                || !oldStatus.equalsIgnoreCase(newStatus)) {

            saveHistory(
                    saved.getId(),
                    oldStatus,
                    newStatus,
                    remarks);
        }

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<?> getHistory(
            @PathVariable Long id) {

        if (!issueRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(
                historyRepository
                        .findByIssueIdOrderByChangedAtDesc(id));
    }

    private void saveHistory(
            Long issueId,
            String oldStatus,
            String newStatus,
            String remarks) {

        IssueHistory history = new IssueHistory();

        history.setIssueId(issueId);
        history.setOldStatus(oldStatus);
        history.setNewStatus(newStatus);
        history.setRemarks(remarks);

        historyRepository.save(history);
    }
}