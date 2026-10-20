package com.classroom.backend;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/grades")
public class GradeController {

    private final GradeRepository gradeRepository;
    private final StudentRepository studentRepository;

    public GradeController(
            GradeRepository gradeRepository,
            StudentRepository studentRepository) {
        this.gradeRepository = gradeRepository;
        this.studentRepository = studentRepository;
    }

    @GetMapping
    public List<GradeResponse> getGrades() {
        return gradeRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GradeResponse addGrade(@RequestBody Grade details) {
        Grade grade = new Grade();
        copyDetails(details, grade);
        return toResponse(gradeRepository.save(grade));
    }

    @PutMapping("/{id}")
    public GradeResponse updateGrade(
            @PathVariable Long id,
            @RequestBody Grade details) {
        Grade grade = findGrade(id);
        copyDetails(details, grade);
        return toResponse(gradeRepository.save(grade));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteGrade(@PathVariable Long id) {
        gradeRepository.delete(findGrade(id));
    }

    private Grade findGrade(Long id) {
        return gradeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Grade not found"));
    }

    private void copyDetails(Grade source, Grade target) {
        if (source.getStudentId() == null
                || source.getSubject() == null
                || source.getSubject().isBlank()
                || source.getAssessment() == null
                || source.getAssessment().isBlank()
                || source.getMarksObtained() == null
                || source.getMaximumMarks() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Student, subject, assessment and marks are required");
        }

        double marks = source.getMarksObtained();
        double maximum = source.getMaximumMarks();

        if (!Double.isFinite(marks)
                || !Double.isFinite(maximum)
                || maximum <= 0
                || marks < 0
                || marks > maximum) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Maximum marks must be positive, and obtained marks must be between zero and maximum marks");
        }

        if (!studentRepository.existsById(source.getStudentId())) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Student not found");
        }

        target.setStudentId(source.getStudentId());
        target.setSubject(source.getSubject().trim());
        target.setAssessment(source.getAssessment().trim());
        target.setMarksObtained(marks);
        target.setMaximumMarks(maximum);
    }

    private GradeResponse toResponse(Grade grade) {
        double rawPercentage =
                grade.getMarksObtained() / grade.getMaximumMarks() * 100;
        double percentage = Math.round(rawPercentage * 100) / 100.0;

        String letterGrade;
        if (rawPercentage >= 90) {
            letterGrade = "A+";
        } else if (rawPercentage >= 80) {
            letterGrade = "A";
        } else if (rawPercentage >= 70) {
            letterGrade = "B";
        } else if (rawPercentage >= 60) {
            letterGrade = "C";
        } else if (rawPercentage >= 50) {
            letterGrade = "D";
        } else {
            letterGrade = "F";
        }

        return new GradeResponse(
                grade.getId(),
                grade.getStudentId(),
                grade.getSubject(),
                grade.getAssessment(),
                grade.getMarksObtained(),
                grade.getMaximumMarks(),
                percentage,
                letterGrade);
    }

    public record GradeResponse(
            Long id,
            Long studentId,
            String subject,
            String assessment,
            Double marksObtained,
            Double maximumMarks,
            double percentage,
            String letterGrade) {
    }
}