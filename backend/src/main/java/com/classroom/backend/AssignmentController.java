package com.classroom.backend;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    private final AssignmentRepository assignmentRepository;

    public AssignmentController(
            AssignmentRepository assignmentRepository) {
        this.assignmentRepository = assignmentRepository;
    }

    @GetMapping
    public List<Assignment> getAssignments() {
        return assignmentRepository.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Assignment addAssignment(@RequestBody Assignment details) {
        Assignment assignment = new Assignment();
        copyDetails(details, assignment);
        return assignmentRepository.save(assignment);
    }

    @PutMapping("/{id}")
    public Assignment updateAssignment(
            @PathVariable Long id,
            @RequestBody Assignment details) {
        Assignment assignment = findAssignment(id);
        copyDetails(details, assignment);
        return assignmentRepository.save(assignment);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAssignment(@PathVariable Long id) {
        assignmentRepository.delete(findAssignment(id));
    }

    private Assignment findAssignment(Long id) {
        return assignmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Assignment not found"));
    }

    private void copyDetails(Assignment source, Assignment target) {
        if (source.getSubject() == null
                || source.getSubject().isBlank()
                || source.getTitle() == null
                || source.getTitle().isBlank()
                || source.getDueDate() == null
                || source.getInstructions() == null
                || source.getInstructions().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Subject, title, due date and instructions are required");
        }

        String subject = source.getSubject().trim();
        String title = source.getTitle().trim();
        String instructions = source.getInstructions().trim();

        if (subject.length() > 255
                || title.length() > 255
                || instructions.length() > 5000) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Subject and title allow 255 characters; instructions allow 5000");
        }

        target.setSubject(subject);
        target.setTitle(title);
        target.setDueDate(source.getDueDate());
        target.setInstructions(instructions);
    }
}