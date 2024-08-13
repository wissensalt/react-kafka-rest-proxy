# React Kafka Rest Proxy
This is an exmple implementation of Kafka Rest Proxy with Publisher/ Subscriber client using React (Frontend) and SpringBoot (Backend).

## Application Flows: 
- Frontend will pub/sub through kafka rest proxy.
- Frontend must be authenticated via Microsoft Entra before doing pub/sub.
- Backend will pub/sub through kafka directly.
- Backend does not need to authenticate to communicate with kafka.

## Reference
Full Stack Docker Compose Configuration Provided by [Conductor](https://github.com/conduktor/kafka-stack-docker-compose)