package com.wissensalt.backend;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RequiredArgsConstructor
@RestController
@SpringBootApplication
public class BackendApplication {
	private final ObjectMapper objectMapper;
	private final KafkaTemplate<String, Object> kafkaTemplate;

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	@PostMapping(value = "/send", consumes = "application/json", produces = "application/json")
	public void send(
			@RequestBody Payload payload
	) throws JsonProcessingException {
		log.info("Sending Message: {}", payload);
		String payloadAsString = objectMapper.writeValueAsString(payload);
		kafkaTemplate.send("topic-one", payloadAsString);
		log.info("Message Sent");
	}

	@GetMapping
	public Payload helloWorld() {

		return new Payload("coding", "Hello World");
	}

	@GetMapping("/greeting/{name}")
	public Payload greeting(@PathVariable("name") String name) {

		return new Payload("abc", name);
	}

	@KafkaListener(topics = "topic-one", groupId = "backend-consumer-group")
	public void listen(String message) {
		log.info("Received Message in group backend-consumer-group: {}", message);
	}
}
