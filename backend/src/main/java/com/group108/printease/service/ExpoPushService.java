package com.group108.printease.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;

@Service
public class ExpoPushService {

    private final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
    private final RestTemplate restTemplate;

    public ExpoPushService() {
        this.restTemplate = new RestTemplate();
    }

    public void sendPushNotification(String to, String title, String body, Map<String, Object> data) {
        if (to == null || to.isEmpty()) {
            return;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));
            headers.set("Accept-Encoding", "gzip, deflate");

            Map<String, Object> payload = new HashMap<>();
            payload.put("to", to);
            payload.put("title", title);
            payload.put("body", body);
            payload.put("sound", "default");
            if (data != null) {
                payload.put("data", data);
            }

            List<Map<String, Object>> messages = new ArrayList<>();
            messages.add(payload);

            HttpEntity<List<Map<String, Object>>> request = new HttpEntity<>(messages, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(EXPO_PUSH_URL, request, String.class);
            System.out.println("Push notification response: " + response.getBody());
        } catch (Exception e) {
            System.err.println("Failed to send push notification: " + e.getMessage());
        }
    }
}
