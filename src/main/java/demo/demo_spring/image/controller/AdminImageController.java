package demo.demo_spring.image.controller;

import demo.demo_spring.image.dto.ImageUploadResponse;
import demo.demo_spring.image.service.ImageUploadService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/admin/images")
public class AdminImageController {

    private final ImageUploadService imageUploadService;

    public AdminImageController(ImageUploadService imageUploadService){
        this.imageUploadService = imageUploadService;
    }

    // 이미지 파일 업로드
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE) // multipart/form-data 형식의 요청을 받음.
    public ImageUploadResponse uploadImage(@RequestPart("file") MultipartFile file){
        // 요청 안에 들어온 여러 조각 중에서 특정 조각 꺼내기 (key_file, type_File, value>panda.jpg 중 key_file꺼내기)
        String imageUrl = imageUploadService.upload(file);

        return new ImageUploadResponse(imageUrl);
    }
    /* 보통 다른 json과 다르게 파일은 그대로 담기 어려움.
    이미지 파일은 글자가 아니라 실제 바이너리 데이터임.
    그래서 파일 업로드는 보통 multipart/form-data 형식으로 보냄.

    multipart = 여러 조각으로 나눠서 보낸다
    form-data = 폼 데이터 형식으로 보낸다

    그래서 컨트롤러에서 @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)라고 히면
    이 POST API는 json 요청이 아니라, multipart/form-data형식의 요청을 받는 API라는 의미임.

    즉, 요청 형식 제한/명시임.
    */
}
