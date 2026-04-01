//package demo.demo_spring.hotdeal.service;
//
//import demo.demo_spring.hotdeal.domain.HotDeal;
//import demo.demo_spring.hotdeal.repository.HotDealRepository;
//import org.springframework.orm.ObjectOptimisticLockingFailureException;
//import org.springframework.stereotype.Service;
//
//@Service
//public class OptimisticLockFacade {
//    //필드에 공통 도구로 서비스 가져오기
//    private final HotDealService hotDealService;
//    public OptimisticLockFacade(HotDealService hotDealService){
//        this.hotDealService = hotDealService; //이 클래스에서 사용하기 위해 저장
//    }
//
//    //@Transactional 전혀 붙이면 안됨. 붙이면 반목준 전체가 한 트랜잭션처럼 묶여서
//    // 재시도 구조가 흐려짐
//    public void buyOptimisticLockWithRetry(Long id){ //낙천적 락 재시도
//        //낙관적 락 충돌시에만 재시도를 하는거지, 핫딜없음/재고없음의 경우 재시도하면 안됨
//        for(int i=0;i<10;i++){ //최대 몇번까지 재시도할지 : 10번으로 설정
//            try{
//                // 서비스의 buyOptimisticLock(id) 호출
//                hotDealService.buyOptimisticLock(id);
//                return;
//            }catch(ObjectOptimisticLockingFailureException e){
//                // 낙관적 락 충돌만 재시도
//                continue;
//            }
//        }
//        throw new IllegalStateException("낙관적 락 최대 재시도 횟수 초과");
//    }
//
//}
