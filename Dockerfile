# 빌드 스테이지 -> jar 만들기

# FROM : 이미지 시작할 기본 환경 설정 -> java 25 jdk으로 시작.
FROM eclipse-temurin:25-jdk AS build

# 컨테이너 안에서 작업폴더 /app으로 지정
WORKDIR /app

# 복사할 것들 레이어 맞춰서 차례차례 넣어주기

COPY gradlew .
# gradle사하여 사용하기 위해, 로컬 프로젝트에 있는 gradlew 파일을 컨테이너의 작업폴더 루트지점에 복사해넣기
COPY gradle gradle
# 로컬 프로젝트의 gradle 폴더를 컨테이너 안의 /app/gradle로 복사하기.

# 위 두줄은 세트 -> 컨테이너 안에서도 ./gradlew 명령을 쓸 수 있게 준비함. -> 엔진 준비.

COPY build.gradle settings.gradle ./
# -> 설계도 넣기.
# build.gradle -> 의존성, java버전, spring boot 플러그인 등 설정
# settings.gradle -> 프로젝트 이름, 멀티모듈 여부 등 설정

RUN chmod +x ./gradlew
# chmod -> change mode, 파일이나 디렉터리의 권한 변경
# +x -> 권한 추가
# gradlew 파일에 실행권한 주기.

COPY src src
# 로컬 프로젝트 내 소스코드

# 준비한 gradlew과 build.gradlew, build.settings, src등을 이용해 jar 만들기
RUN ./gradlew clean bootJar -x test --no-daemon
# clean -> 빌드 시작전, 혹시 남아있을지 모를 이전 빌드 찌꺼지 싹 지우기(청소)
# bootjar -> 소스코드랑 라이브러리 의존성 다 가져와서 .jar 확장자 압축파일 만들기
# -x test -> exclude제외. 테스트 건너뛰고 빌드하기.
# --no-daemon -> 도커 컨테이너에서 쓸 일회용 모드


# 실행 스테이지 (최종 이미지) -> build에서 jar 가져와서 실행하기
FROM eclipse-temurin:25-jdk

#작업폴더 /app으로 지정.
WORKDIR /app

#build라고 한거에서, jar파일 가져다가, 현재 /app/app.jar로 복사하기.
COPY --from=build /app/build/libs/*.jar app.jar
# --from=build -> build에서 가져온다
# /app/build/libs/*.jar -> 최종결과물인 .jar파일 위치
# app.jar -> /app/app.jar로 복사하기

# 포트 8080 사용
EXPOSE 8080

# ENTRYPOINT : 컨테이너가 시작할때 실행할 명령어
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
# 시작되면 java -jar /app/app.jar 실행하라.