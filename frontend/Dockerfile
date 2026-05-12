# FROM : 이미지 시작할 기본 환경 설정 -> node:22환경으로 시작.
FROM node:22-alpine AS build

#작업 폴더 지정
WORKDIR /app

# 로컬 프로젝트 frontend의 의존성 관리 파일들을 컨테이너 작업폴더로 복사.
COPY package*.json ./

# 컨테이너 안 의존성 설치
RUN npm ci

# 환경변수

ARG VITE_PORTONE_STORE_ID
ARG VITE_PORTONE_CHANNEL_KEY

ENV VITE_PORTONE_STORE_ID=store-4acd4bd8-8721-4c5f-81cf-a5cd7ace9145
ENV VITE_PORTONE_CHANNEL_KEY=channel-key-bd61e964-30ab-4f59-a67e-24c1b162557e

# forntend폴더의 소스코드 전체를 도커 컨테이너 /app으로 복사하기. -> 소스코드 빌드
COPY . .

# 프론트 빌드 명령어 -> dist폴더 생성됨.
RUN npm run build


# 빌드끝난 프론트는 node.js필요x -> nginx 사용.
FROM nginx:alpine

# frontend/nginx.conf 파일을 nginx 설정 위치로 복사하기
COPY nginx.conf /etc/nginx/conf.d/default.conf

# build단계에서 만든 /app/dist파일을, 현재 nginx의 웹 루트폴더로 복사하기.
COPY --from=build /app/dist /usr/share/nginx/html

# 포트 80 사용
EXPOSE 80