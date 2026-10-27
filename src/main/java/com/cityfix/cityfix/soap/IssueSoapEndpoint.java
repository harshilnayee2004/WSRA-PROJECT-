package com.cityfix.cityfix.soap;

import java.io.StringReader;

import javax.xml.transform.Source;
import javax.xml.transform.stream.StreamSource;

import org.springframework.stereotype.Component;
import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;

import com.cityfix.cityfix.repository.IssueRepository;

@Endpoint
@Component
public class IssueSoapEndpoint {

    private static final String NAMESPACE =
            "http://cityfix.com/soap/issues";

    private final IssueRepository issueRepository;

    public IssueSoapEndpoint(
            IssueRepository issueRepository) {
        this.issueRepository = issueRepository;
    }

    @PayloadRoot(
            namespace = NAMESPACE,
            localPart = "GetIssueStatisticsRequest")
    @ResponsePayload
    public Source getStatistics(
            @RequestPayload Source request) {

        long total = issueRepository.count();

        long submitted =
                issueRepository.countByStatusIgnoreCase("SUBMITTED");

        long assigned =
                issueRepository.countByStatusIgnoreCase("ASSIGNED");

        long inProgress =
                issueRepository.countByStatusIgnoreCase("IN_PROGRESS");

        long resolved =
                issueRepository.countByStatusIgnoreCase("RESOLVED");

        long closed =
                issueRepository.countByStatusIgnoreCase("CLOSED");

        String xml =
                "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
                + "<GetIssueStatisticsResponse "
                + "xmlns=\"" + NAMESPACE + "\">"
                + "<totalIssues>" + total
                + "</totalIssues>"
                + "<submittedIssues>" + submitted
                + "</submittedIssues>"
                + "<assignedIssues>" + assigned
                + "</assignedIssues>"
                + "<inProgressIssues>" + inProgress
                + "</inProgressIssues>"
                + "<resolvedIssues>" + resolved
                + "</resolvedIssues>"
                + "<closedIssues>" + closed
                + "</closedIssues>"
                + "</GetIssueStatisticsResponse>";

        return new StreamSource(new StringReader(xml));
    }
}