
# FROM : 이미지 시작할 기본 환경 설정 -> node:22환경으로 시작.
FROM node:22-alpine AS build

#작업 폴더 지정
WORKDIR /app

#frontend 폴더에 있는 .json들을 컨테이너의 /app으로 복사하기.
COPY package*.json ./

# 컨테이너 안에서 의존성을 설치하기.
RUN npm ci

# ARG = docker build 때 외부에서 받는 값
ARG VITE_PORTONE_STORE_ID
ARG VITE_PORTONE_CHANNEL_KEY

# ENW = 컨테이너 안 환경변수로 설정하는 값
ENV VITE_PORTONE_STORE_ID=store-4acd4bd8-8721-4c5f-81cf-a5cd7ace9145
ENV VITE_PORTONE_CHANNEL_KEY=channel-key-bd61e964-30ab-4f59-a67e-24c1b162557e

# forntend 폴더의 나머지 소스코드를 전부 컨테이너 /app으로 복사하기.
COPY . .

#---> 소스코드 빌드

# 프론트 빌드 명령어
RUN npm run build


# 빌드끝난 프론트는 node.js필요x -> nginx 사용.
FROM nginx:alpine

# frontend/nginx.conf 파일을 nginx 설정 위치로 복사하기
COPY nginx.conf /etc/nginx/conf.d/default.conf
# build단계에서 만든 /app/dist폴더를, 현재 ngix이미지의 /usr/share/ngins/html로 복사하기.
COPY --from=build /app/dist /usr/share/nginx/html

# 포트 80 사용
EXPOSE 80