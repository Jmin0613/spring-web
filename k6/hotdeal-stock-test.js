// k6/hotdeal-stock-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

/*
    재고 선점 전략 비교용 k6 스크립트

    비교
        1. no-lock (일반 DB 접근)
        2. pessimistic-lock (DB 비관적 락)
        3. redis-lua (Redis + Lua)
 */

export const successReserve = new Counter('success_reserve');
export const failReserve = new Counter('fail_reserve');
export const otherFail = new Counter('other_fail');

export const options = {
    scenarios: {
        hotdeal_stock_test: {
            executor: 'shared-iterations',
            vus: Number(__ENV.VUS || 100),
            iterations: Number(__ENV.ITERATIONS || 300),
            maxDuration: __ENV.MAX_DURATION || '60s',
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<2000'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const HOTDEAL_ID = Number(__ENV.HOTDEAL_ID || 1);
const QUANTITY = Number(__ENV.QUANTITY || 1);

// no-lock | pessimistic-lock | redis-lua
const STRATEGY = __ENV.STRATEGY || 'redis-lua';

// no-lock에서 동시성 문제를 더 잘 드러내기 위한 테스트용 지연값
// no-lock 전략일때만 URL에 포함됨
const DELAY_MS = Number(__ENV.DELAY_MS || 0);

const DEBUG_FAIL = (__ENV.DEBUG_FAIL || 'false') === 'true';

function buildUrl() {
    let url = `${BASE_URL}/test/stocks/hotdeals/${HOTDEAL_ID}/${STRATEGY}?quantity=${QUANTITY}`;

    if (STRATEGY === 'no-lock' && DELAY_MS > 0) {
        url += `&delayMs=${DELAY_MS}`;
    }

    return url;
}

function parseBody(res) {
    try {
        return JSON.parse(res.body);
    } catch (e) {
        return null;
    }
}

export default function () {
    const res = http.post(buildUrl());

    const statusOk = check(res, {
        'status is 200': (r) => r.status === 200,
    });

    if (!statusOk) {
        otherFail.add(1);

        if (DEBUG_FAIL) {
            console.log(`OTHER_FAIL status=${res.status}, body=${res.body}`);
        }

        return;
    }

    const body = parseBody(res);

    if (body === null) {
        otherFail.add(1);

        if (DEBUG_FAIL) {
            console.log(`JSON_PARSE_FAIL body=${res.body}`);
        }

        return;
    }

    if (body.success === true) {
        successReserve.add(1);
    } else if (body.success === false) {
        failReserve.add(1);
    } else {
        otherFail.add(1);

        if (DEBUG_FAIL) {
            console.log(`UNKNOWN_RESPONSE body=${res.body}`);
        }
    }

    sleep(0.05);
}