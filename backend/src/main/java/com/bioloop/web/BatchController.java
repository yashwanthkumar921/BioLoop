package com.bioloop.web;

import com.bioloop.domain.enums.ProofKind;
import com.bioloop.security.SecurityUtils;
import com.bioloop.service.BatchWorkflowService;
import com.bioloop.service.ProofUploadService;
import com.bioloop.web.dto.BatchDtos.BatchEventResponse;
import com.bioloop.web.dto.BatchDtos.BatchResponse;
import com.bioloop.web.dto.BatchDtos.CreateBatchRequest;
import com.bioloop.web.dto.BatchDtos.NearbyBatchResponse;
import com.bioloop.web.dto.BatchDtos.ProofUploadResponse;
import com.bioloop.web.dto.BatchDtos.StatusUpdateRequest;
import com.bioloop.web.dto.BatchDtos.VerifyRequest;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/batches")
public class BatchController {

    private final BatchWorkflowService workflow;
    private final ProofUploadService proofUploadService;

    public BatchController(BatchWorkflowService workflow, ProofUploadService proofUploadService) {
        this.workflow = workflow;
        this.proofUploadService = proofUploadService;
    }

    @PostMapping
    public BatchResponse create(@Valid @RequestBody CreateBatchRequest request) {
        return workflow.create(SecurityUtils.currentUser(), request);
    }

    @GetMapping("/nearby")
    public List<NearbyBatchResponse> nearby(
            @RequestParam("lat") double lat,
            @RequestParam("lng") double lng,
            @RequestParam(name = "radius", defaultValue = "8") double radius
    ) {
        return workflow.nearby(lat, lng, radius);
    }

    @GetMapping("/mine")
    public List<BatchResponse> mine() {
        return workflow.mine(SecurityUtils.currentUser());
    }

    @GetMapping("/open-jobs")
    public List<BatchResponse> openJobs() {
        return workflow.openJobs();
    }

    @GetMapping("/{id}")
    public BatchResponse get(@PathVariable("id") UUID id) {
        return workflow.get(id);
    }

    @GetMapping("/{id}/events")
    public List<BatchEventResponse> getEvents(@PathVariable("id") UUID id) {
        return workflow.getEvents(id);
    }

    @PatchMapping("/{id}/claim")
    public BatchResponse claim(@PathVariable("id") UUID id) {
        return workflow.claim(SecurityUtils.currentUser(), id);
    }

    @PatchMapping("/{id}/accept")
    public BatchResponse accept(@PathVariable("id") UUID id) {
        return workflow.acceptJob(SecurityUtils.currentUser(), id);
    }

    @PatchMapping("/{id}/status")
    public BatchResponse status(@PathVariable("id") UUID id, @Valid @RequestBody StatusUpdateRequest request) {
        return workflow.updateStatus(SecurityUtils.currentUser(), id, request);
    }

    @PostMapping("/{id}/verify")
    public BatchResponse verify(@PathVariable("id") UUID id, @Valid @RequestBody VerifyRequest request) {
        return workflow.verify(SecurityUtils.currentUser(), id, request);
    }

    @PostMapping(value = "/{id}/proofs", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProofUploadResponse uploadProof(
            @PathVariable("id") UUID id,
            @RequestParam("kind") ProofKind kind,
            @RequestParam("file") MultipartFile file
    ) {
        return proofUploadService.uploadProof(SecurityUtils.currentUser(), id, kind, file);
    }

    @GetMapping("/{id}/proofs")
    public List<ProofUploadResponse> getProofs(@PathVariable("id") UUID id) {
        return proofUploadService.getProofs(id);
    }
}
