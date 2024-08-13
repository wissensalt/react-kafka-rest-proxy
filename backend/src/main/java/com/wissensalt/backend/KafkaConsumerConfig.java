package com.wissensalt.backend;

import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.springframework.boot.autoconfigure.kafka.KafkaProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;

@EnableKafka
@RequiredArgsConstructor
@Configuration
public class KafkaConsumerConfig {

  @Bean
  public ConsumerFactory<String, Object> consumerFactory(KafkaProperties kafkaProperties) {
    Map<String, Object> config = new HashMap<>();
    config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG,
        kafkaProperties.getConsumer().getBootstrapServers());
    config.put(ConsumerConfig.GROUP_ID_CONFIG, kafkaProperties.getConsumer().getGroupId());
    config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG,
        kafkaProperties.getConsumer().getKeyDeserializer());
    config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG,
        kafkaProperties.getConsumer().getValueDeserializer());

    return new DefaultKafkaConsumerFactory<>(config);
  }


  @Bean
  public ConcurrentKafkaListenerContainerFactory<String, Object> kafkaListener(
      ConsumerFactory<String, Object> consumerFactory) {
    ConcurrentKafkaListenerContainerFactory<String, Object> factory = new ConcurrentKafkaListenerContainerFactory<>();
    factory.setConsumerFactory(consumerFactory);

    return factory;
  }
}
