import http from "k6/http";
import { sleep, check } from "k6";

export default function () {
    const headers = {
        address: "0:90c0a499c31bfc7a58bd4d5ff23c9acbffaaa705ea3ed5ad0937ac8f504644d7",
    };

    // Assign the result of the HTTP request to `res`
    const res = http.get("http://localhost:5002/api/token-launches/get-chunk?page=1&limit=10&orderBy=created_at&order=ASC", {
        headers: headers,
    });

    // Check that the response status is 200
    check(res, {
        'status is 200': (r) => r.status === 200,
    });
}
