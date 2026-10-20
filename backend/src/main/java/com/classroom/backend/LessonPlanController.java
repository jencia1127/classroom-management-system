package com.classroom.backend;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/lesson-plans")
public class LessonPlanController {

    private final LessonPlanRepository lessonPlanRepository;

    public LessonPlanController(
            LessonPlanRepository lessonPlanRepository) {
        this.lessonPlanRepository = lessonPlanRepository;
    }

    @GetMapping
    public List<LessonPlan> getLessonPlans() {
        return lessonPlanRepository.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LessonPlan addLessonPlan(@RequestBody LessonPlan details) {
        LessonPlan lessonPlan = new LessonPlan();
        copyDetails(details, lessonPlan);
        return lessonPlanRepository.save(lessonPlan);
    }

    @PutMapping("/{id}")
    public LessonPlan updateLessonPlan(
            @PathVariable Long id,
            @RequestBody LessonPlan details) {
        LessonPlan lessonPlan = findLessonPlan(id);
        copyDetails(details, lessonPlan);
        return lessonPlanRepository.save(lessonPlan);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteLessonPlan(@PathVariable Long id) {
        lessonPlanRepository.delete(findLessonPlan(id));
    }

    private LessonPlan findLessonPlan(Long id) {
        return lessonPlanRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Lesson plan not found"));
    }

    private void copyDetails(LessonPlan source, LessonPlan target) {
        if (source.getSubject() == null
                || source.getSubject().isBlank()
                || source.getTopic() == null
                || source.getTopic().isBlank()
                || source.getLessonDate() == null
                || source.getDetails() == null
                || source.getDetails().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Subject, topic, date and lesson details are required");
        }

        String subject = source.getSubject().trim();
        String topic = source.getTopic().trim();
        String details = source.getDetails().trim();

        if (subject.length() > 255
                || topic.length() > 255
                || details.length() > 5000) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Subject and topic allow 255 characters; details allow 5000");
        }

        target.setSubject(subject);
        target.setTopic(topic);
        target.setLessonDate(source.getLessonDate());
        target.setDetails(details);
    }
}