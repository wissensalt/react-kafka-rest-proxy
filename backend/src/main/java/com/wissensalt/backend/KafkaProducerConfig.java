package com.wissensalt.backend;

import java.util.HashMap;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;
import org.springframework.boot.autoconfigure.kafka.KafkaProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.ProducerListener;

@Slf4j
@Configuration
public class KafkaProducerConfig {

  @Bean
  public ProducerFactory<String, Object> producerFactory(KafkaProperties kafkaProperties) {

    Map<String, Object> configProps = new HashMap<>();
    configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG,
        kafkaProperties.getProducer().getBootstrapServers());
    configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG,
        kafkaProperties.getProducer().getKeySerializer());
    configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG,
        kafkaProperties.getProducer().getValueSerializer());

    return new DefaultKafkaProducerFactory<>(configProps);
  }

  @Bean
  public KafkaTemplate<String, Object> kafkaProducerTemplate(
      ProducerFactory<String, Object> producerFactory) {
    KafkaTemplate<String, Object> kafkaTemplate = new KafkaTemplate<>(producerFactory);

    kafkaTemplate.setProducerListener(new ProducerListener<>() {
      @Override
      public void onSuccess(ProducerRecord<String, Object> producerRecord,
          RecordMetadata recordMetadata) {
        log.info("ACK from ProducerListener message: {} offset:  {}",
            producerRecord.value().toString(),
            recordMetadata.offset());
      }

      @Override
      public void onError(ProducerRecord<String, Object> producerRecord,
          RecordMetadata recordMetadata, Exception exception) {
        ProducerListener.super.onError(producerRecord, recordMetadata, exception);
        log.error("Error from ProducerListener message: {} offset:  {}", producerRecord.value(),
            recordMetadata.offset());
        log.error("Error from ProducerListener exception : {}", exception.getMessage());
      }
    });

    return kafkaTemplate;
  }

}
