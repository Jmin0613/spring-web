import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

http.setResponseCallback(http.expectedStatuses(200, 409, 503));

export const successPrepare = new Counter('success_prepare');
export const failPrepare = new Counter('fail_prepare');
export const stockFail = new Counter('stock_fail');
export const dbResourceFail = new Counter('db_resource_fail');
export const timeoutFail = new Counter('timeout_fail');
export const otherFail = new Counter('other_fail');

export const options = {
    scenarios: {
        hotdeal_prepare: {
            executor: 'shared-iterations',
            vus: Number(__ENV.VUS || 100),
            iterations: Number(__ENV.ITERATIONS || 100),
            maxDuration: __ENV.MAX_DURATION || '60s',
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<2000'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const HOTDEAL_ID = Number(__ENV.HOTDEAL_ID || 1);
const MEMBER_ID = Number(__ENV.MEMBER_ID || 2);
const QUANTITY = Number(__ENV.QUANTITY || 1);
const DEBUG_FAIL = (__ENV.DEBUG_FAIL || 'false') === 'true';

function parseBody(res) {
    try {
        return JSON.parse(res.body || '{}');
    } catch (e) {
        return {};
    }
}

function isStockFail(res, body) {
    if (res.status === 409) {
        return true;
    }

    const text = res.body || '';

    return (
        text.includes('재고') ||
        text.includes('부족') ||
        text.includes('핫딜') ||
        text.includes('준비') ||
        body.type === 'STOCK_OR_BUSINESS_FAIL'
    );
}

function isDbResourceFail(res, body) {
    return res.status === 503 || body.type === 'DB_RESOURCE_FAIL';
}

function isExpectedStatus(res) {
    const body = parseBody(res);

    return (
        res.status === 200 ||
        isStockFail(res, body) ||
        isDbResourceFail(res, body)
    );
}

export default function () {
    const payload = JSON.stringify({
        paymentOrderType: 'HOTDEAL_DIRECT',
        hotDealId: HOTDEAL_ID,
        quantity: QUANTITY,
        paymentMethod: 'CARD',
        deliveryInfo: {
            receiverName: '테스트유저',
            phoneNumber: '010-1234-5678',
            address: '스프링시티 k6아파트',
            deliveryMemo: 'k6 테스트',
        },
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const res = http.post(
        `${BASE_URL}/test/payments/hotdeals/prepare?memberId=${MEMBER_ID}`,
        payload,
        params
    );

    check(res, {
        'status is success or expected fail': isExpectedStatus,
    });

    if (res.status === 0) {
        failPrepare.add(1);
        timeoutFail.add(1);
        otherFail.add(1);

        if (DEBUG_FAIL) {
            console.log(`TIMEOUT_FAIL status=${res.status}, error=${res.error}, body=${res.body}`);
        }

        return;
    }

    if (res.status === 200) {
        successPrepare.add(1);
        return;
    }

    failPrepare.add(1);

    const body = parseBody(res);

    if (isStockFail(res, body)) {
        stockFail.add(1);
        return;
    }

    if (isDbResourceFail(res, body)) {
        dbResourceFail.add(1);
        return;
    }

    otherFail.add(1);

    if (DEBUG_FAIL) {
        console.log(`OTHER_FAIL status=${res.status}, body=${res.body}`);
    }

    sleep(0.1);
}