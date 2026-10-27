package com.cityfix.cityfix.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.cityfix.cityfix.entity.FieldOfficer;
import com.cityfix.cityfix.repository.FieldOfficerRepository;

@RestController
@RequestMapping("/api/officers")
public class FieldOfficerController {

    private final FieldOfficerRepository repository;

    public FieldOfficerController(
            FieldOfficerRepository repository) {
        this.repository = repository;
    }

    @PostMapping
    public ResponseEntity<FieldOfficer> create(
            @RequestBody FieldOfficer officer) {

        officer.setId(null);

        FieldOfficer saved = repository.save(officer);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(saved);
    }

    @GetMapping
    public List<FieldOfficer> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<FieldOfficer> getById(
            @PathVariable Long id) {

        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<FieldOfficer> update(
            @PathVariable Long id,
            @RequestBody FieldOfficer officer) {

        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        officer.setId(id);

        return ResponseEntity.ok(repository.save(officer));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id) {

        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        repository.deleteById(id);

        return ResponseEntity.noContent().build();
    }
}