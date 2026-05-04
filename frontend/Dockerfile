# FROM : 이미지 시작할 기본 환경 설정 -> node:22환경으로 시작.
FROM node:22-alpine AS build

#작업 폴더 지정
WORKDIR /app

COPY package*.json ./
# 로컬 프로젝트 frontend의 의존성 관리 파일들을 컨테이너 작업폴더로 복사.
# ackage*.json -> package.json + package-lock.json

# 컨테이너 안에서 의존성을 설치하기.
RUN npm ci

# ARG = 도커 이미지를 build할 때, 외부에서 받는 값
ARG VITE_PORTONE_STORE_ID
ARG VITE_PORTONE_CHANNEL_KEY
# 밖에서 값을 받을 통로를 만듦

# ENW = 컨테이너 안 환경변수로 설정하는 값
ENV VITE_PORTONE_STORE_ID=store-4acd4bd8-8721-4c5f-81cf-a5cd7ace9145
ENV VITE_PORTONE_CHANNEL_KEY=channel-key-bd61e964-30ab-4f59-a67e-24c1b162557e
# 원래라면 받은 값을 컨테이너 안에 저장하겠지만, 값을 직접 박아넣음.
# 값을 받을 통로는 만들어두지만, 뭘 주든 상관없이 이 변수에는 무조건 이 값을 쓸거란 의미.

# -> 고로 현재 ARG 없어도 되지만, 나중에 보안을 위해 키값을 직접 안쓰고 변수처리 할 수 있으니 만들어 두기.

# forntend폴더의 소스코드 전체를 도커 컨테이너 /app으로 복사하기. -> 소스코드 빌드
COPY . .

# 프론트 빌드 명령어 -> dist폴더 생성됨.
RUN npm run build


# 빌드끝난 프론트는 node.js필요x -> nginx 사용.
FROM nginx:alpine
# ngix : html파일을 웹 브라우저에 뿌려주는 전용 서버 프로그램.
# alpine : 실행할때 기능 많을 필요x -> 용량 줄인 alpine 버전 사용.

# frontend/nginx.conf 파일을 nginx 설정 위치로 복사하기
COPY nginx.conf /etc/nginx/conf.d/default.conf

# build단계에서 만든 /app/dist파일을, 현재 nginx의 웹 루트폴더로 복사하기.
COPY --from=build /app/dist /usr/share/nginx/html
# --from=build -> build에서 가져온다
# /app/dist -> 최종결과물인 dist폴더를
# /usr/share/nginx/html -> nginx의 웹 루트폴더로 복사하기

# 포트 80 사용
EXPOSE 80