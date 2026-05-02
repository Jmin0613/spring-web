# 빌드 스테이지 -> jar 만들기

# FROM : 이미지 시작할 기본 환경 설정 -> java 25 jdk으로 시작.
FROM eclipse-temurin:25-jdk AS build
# eclipse-temurin -> 자바가 이미 설치된 이미지. 예시 템플릿의 ubuntu는 직접 설치해야 함.

# 컨테이너 안에서 작업할 폴더 /app으로 지정. 이후 명령어들은 기본적으로 이 안에서 실행됨.
WORKDIR /app

COPY gradlew .
# 로컬 프로젝트의 gradlew 파일을 컨테이너 안의 현재폴더(. -> /app)로 복사하기.
COPY gradle gradle
# 로컬 프로젝트의 gradle 폴더를 컨테이너 안의 /app/gradle로 복사하기.

# 위 두줄은 세트 -> 컨테이너 안에서도 ./gradlew 명령을 쓸 수 있게 준비함.

COPY build.gradle settings.gradle ./
# build.gradle과 settings.gradle을 컨테이너 안 /app으로 복사.
# build.gradle -> 의존성, java버전, spring boot 플러그인 등 설정
# settings.gradle -> 프로젝트 이름, 멀티모듈 여부 등 설정

RUN chmod +x ./gradlew
# gradlew 파일에 실행권한 주기.

COPY src src
# 로컬 프로젝트의 src폴더를 컨테이너 안의 /app/src로 복사하기.

RUN ./gradlew clean bootJar -x test --no-daemon
# 컨테이너 안에서 Gradle 빌드를 실행하라는 명령어.


# 실행 스테이지 (최종 이미지) -> jar 실행하기
FROM eclipse-temurin:25-jdk

#작업폴더 /app으로 지정.
WORKDIR /app

#build라고 한거에서, jar파일 가져다가, 현재 /app/app.jar로 복사하기.
COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080
# 포트 8080 사용한다고 알려주기.

# ENTRYPOINT : 컨테이너가 시작할때 실행할 명령어
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
# 시작되면 java -jar /app/app.jar 실행하라.