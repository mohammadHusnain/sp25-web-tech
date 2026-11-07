FROM eclipse-temurin:21-jre
COPY keycloak-26.8.2 /opt/keycloak
ENV KC_HTTP_HOST=0.0.0.0
EXPOSE 8080
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
