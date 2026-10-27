package com.cityfix.cityfix.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.cityfix.cityfix.entity.Citizen;
import com.cityfix.cityfix.repository.CitizenRepository;

@RestController
@RequestMapping("/api/citizens")
public class CitizenController {

    private final CitizenRepository repository;

    public CitizenController(CitizenRepository repository) {
        this.repository = repository;
    }

    @PostMapping
    public ResponseEntity<Citizen> create(
            @RequestBody Citizen citizen) {

        citizen.setId(null);

        Citizen saved = repository.save(citizen);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(saved);
    }

    @GetMapping
    public List<Citizen> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Citizen> getById(
            @PathVariable Long id) {

        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Citizen> update(
            @PathVariable Long id,
            @RequestBody Citizen citizen) {

        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        citizen.setId(id);

        return ResponseEntity.ok(repository.save(citizen));
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