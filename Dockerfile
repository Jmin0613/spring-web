# 빌드 스테이지 -> jar 만들기

# FROM : 이미지 시작할 기본 환경 설정 -> java 25 jdk으로 시작.
FROM eclipse-temurin:25-jdk AS build

# 컨테이너 안에서 작업폴더 /app으로 지정
WORKDIR /app

# 복사할 것들 레이어 맞춰서 차례차례 넣어주기
COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./

# 실행 권한 추가
RUN chmod +x ./gradlew

# 로컬 프로젝트 내 소스코드
COPY src src

# 준비한 gradlew과 build.gradlew, build.settings, src등을 이용해 jar 만들기
RUN ./gradlew clean bootJar -x test --no-daemon

# 실행 스테이지 (최종 이미지) -> build에서 jar 가져와서 실행하기
FROM eclipse-temurin:25-jdk

#작업폴더 /app으로 지정.
WORKDIR /app

#build라고 한거에서, jar파일 가져다가, 현재 /app/app.jar로 복사하기.
COPY --from=build /app/build/libs/*.jar app.jar

# 포트 8080 사용
EXPOSE 8080

# ENTRYPOINT : 컨테이너가 시작할때 실행할 명령어
ENTRYPOINT ["java", "-jar", "/app/app.jar"]