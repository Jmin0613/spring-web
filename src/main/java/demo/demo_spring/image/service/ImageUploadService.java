package demo.demo_spring.image.service;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class ImageUploadService {

    // 파일 크기 최대 10MB까지 허용
    private static final long MAX_FILE_SIZE = 10*1024*1024;

    // 업로드 허용할 이미지 타입 목록 -> 값 포함되있는지 확인하기 쉽게 Set이용
    private static final Set<String> ALLOWED_CONTENT_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

    // 이미지 저장될 폴더 경로
    private final Path uploadRootPath = Paths.get("uploads", "images")
            .toAbsolutePath() //상대경로를 절대경로로 바뀜.
            .normalize(); // 경로 정리

    @PostConstruct
    // 스프링이 객체 생성 + 의존성 주입 끝낸 다음, 이 메서드를 한 번 실행하라.
    // 즉, 서버가 켜질떄 uploads/images 폴더 미리 만듦.
    public void init(){ //서비스 생성 직후, 자동으로 실행되는 초기화 메서드
        try{
            Files.createDirectories((uploadRootPath)); //폴더 없으면 만들기. 이거 있어서 업로드할떄마다 폴더 존재 여부 매번 확인x
        } catch(IOException e){
            throw new IllegalStateException("이미지 업로드 폴더를 생성하지 못했습니다.", e);
        }
    }

    // 파일 받아서 검증 + 저장 + 접근 가능한 이미지 url로 반환
    public String upload(MultipartFile file){
        // 파일 검증 -> 파일이 비었는지, 10MB 이하인지, 이미지 타입인지 검사
        validateFile(file);

        // 확장자 가져오기
        String extension = getExtension(file);
        // 파일 저장명 만들기 -> UUID로 겹치지 않는 저장 파일명 만듦.
        String savedFileName = UUID.randomUUID() + extension; //랜덤 + 확장자

        // 파일 저장 경로 만들기
        Path targetPath = uploadRootPath.resolve(savedFileName).normalize();
        //resolve() -> 폴더경로 + 파일명 (합쳐주는 메서드)

        // 실제 파일 저장
        try{
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            //file.getInputStream() -> 업로드된 파일의 실제 데이터를 읽어오는 통로
            //StandardCopyOption.REPLACE_EXISTING -> 만약 같은 이름의 파일이 이미 있으면 덮어쓴다는 의미.(UUID라 겹칠 가능성 X)

        } catch (IOException e){
            throw new IllegalStateException("이미지 파일 저장에 실패했습니다.", e);
        }

        // 이미지 url 만들기
        String imagePath = "/uploads/images/" + savedFileName; // 브라우저에서 접글할 url 뒷부분

        return ServletUriComponentsBuilder
                .fromCurrentContextPath()
                .path(imagePath)
                .toUriString();
    }

    // 파일 검증 메서드
    private void validateFile(MultipartFile file){
        // 1. 파일이 비어있는지 아닌지
        if(file == null || file.isEmpty()){
            throw new IllegalArgumentException("업로드할 이미지 파일을 선택해주세요.");
        }

        // 2. 10mb 이하인지
        if(file.getSize() > MAX_FILE_SIZE){
            throw new IllegalArgumentException("이미지 파일은 10MB 이하만 업로드할 수 있습니다.");
        }

        // 3. 허용된 이미지 타입이 맞는지
        String contentType = file.getContentType();

        if(contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)){
            throw new IllegalArgumentException("jpg, png, webp, gif 파일만 업로드할 수 있습니다.");
        }
    }

    // 확장자 가져오기
    private String getExtension(MultipartFile file){
        // 원본 파일면 가져오기
        String originalFilename = file.getOriginalFilename();

        if(originalFilename != null && !originalFilename.isBlank()){
            String cleanFilename = StringUtils.cleanPath(originalFilename); // 파일명 정리하기

            int dotIndex = cleanFilename.lastIndexOf("."); // 확장자 . 점 추가

            // 확장자 반환
            if(dotIndex != -1){
                return cleanFilename.substring(dotIndex).toLowerCase();
                // .점 있으면 그 점부터 끝까지 자르기. + 소문자로 바꾸기.
            }
        }

        // 파일명에서 확장자 못찾으면, Content-type으로 확장자 결정
        String contentType = file.getContentType();

        if("image/jpeg".equals(contentType)){ return ".jpg"; }
        if("image/png".equals(contentType)){ return ".png"; }
        if("image/webp".equals(contentType)){ return ".webp"; }
        if("image/gif".equals(contentType)){ return ".gif"; }

        return ".jpg";
    }

}
