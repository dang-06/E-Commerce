# Tai lieu giao hang SPX

## Muc dich

Thu muc nay dung de luu tai lieu tich hop va van hanh giao hang SPX cho du an website ban hang.

## Trang thai

- Tich hop SPX: CAN XAC NHAN
- API/endpoint sandbox: da co host test
- Credential/auth scheme: da co AppID test, secret khong luu trong repo
- Quy trinh tao van don: CAN XAC NHAN
- Quy trinh cap nhat trang thai giao hang: CAN XAC NHAN

## Tai lieu tham khao

- Thiet ke luong tich hop: `documents/spx-delivery/INTEGRATION_FLOW.md`
- API reference da tong hop trong repo: `documents/spx-delivery/API_REFERENCE.md`
- API integration guide: https://spx.vn/en/integration/en/guide/5d7b95a313bb421595e32f94f70e7e10
- How to call the open API: https://spx.vn/en/integration/en/guide/0326238ca1bb4ef19bf90be877ffcc4c
- Order API: https://spx.vn/en/integration/en/api/fac2bc87fefa41e197e00fc4384e144a
- Create order API: https://spx.vn/en/integration/en/api/ad937217160542b88036f269533ff9b7
- Create account API: https://spx.vn/en/integration/en/api/51032efdb4084e72a8b60dd56194dd79
- Error code table: https://spx.vn/en/integration/en/guide/beef04af97d24f289a14c45147ddfd98
- Order status table: https://spx.vn/en/integration/en/guide/1cb6b11014b241a19f5395cdc52b6f8d
- Parameter enumeration mapping table: https://spx.vn/en/integration/en/guide/babd1497ec4b480e95c69429cc1b2e3b
- API call relationship: https://spx.vn/en/integration/en/guide/7aa7171a8f944d69bd90e1444df69d0b
- API address guide: https://spx.vn/en/integration/en/guide/42b8a47e5edd46c8a46666fcd8aba0bb

## Moi truong va credential

### Test

- Host: `https://test-stable.spx.vn/`
- AppID: `1000628`
- App secret: khong luu vao repository. Luu trong bien moi truong local/secret manager bang `SPX_APP_SECRET`.

### Live

- Host Vietnam: `https://spx.vn/`
- AppID: CAN XAC NHAN
- App secret: CAN XAC NHAN

### Quy tac host theo CID

- Non-live: `https://test-stable.spx.{{CID}}/`
- Live: `https://spx.{{CID}}/`

Vi du:

- Vietnam: `https://test-stable.spx.vn/`, `https://spx.vn/`
- Thailand: `https://test-stable.spx.co.th/`, `https://spx.co.th/`
- Singapore: `https://test-stable.spx.sg/`, `https://spx.sg/`
- Indonesia: `https://test-stable.spx.co.id/`, `https://spx.co.id/`

## Cach goi API

- Tat ca API dung method `POST`.
- Encoding: UTF-8.
- Body: JSON.
- `Content-Type`: `Application/JSON`.
- Moi request bat buoc co header: `app-id`, `check-sign`, `timestamp`, `random-num`.

### Header chung

| Header | Type | Bat buoc | Mo ta |
|---|---:|---|---|
| `app-id` | integer | Y | AppID do SPX Open Platform cap, moi app la duy nhat. |
| `check-sign` | string | Y | Chu ky dung de xac minh nguon request. |
| `timestamp` | integer | Y | Unix timestamp theo giay, khong dung millisecond. |
| `random-num` | integer | Y | So ngau nhien, rang buoc signed 64-bit integer. |

### Tao `check-sign`

Du lieu can co:

- `app-id`
- `app-secret`
- `timestamp` theo giay
- `random-num`
- payload JSON trong request body, convert thanh string dung dinh dang truoc khi ky

Thuat toan:

1. Tao chuoi goc theo format:

```text
<app-id>_<timestamp>_<random-num>_<JSON.stringify(payload)>
```

2. Ky chuoi goc bang `HMAC-SHA256` voi `app-secret`.
3. Encode ket qua dang hex va gan vao header `check-sign`.

Vi du Node.js theo tai lieu SPX:

```js
const crypto = require("crypto");

const appId = 100000;
const appSecret = "H25HY53GO4BA2GQ";
const timestamp = parseInt(Date.now() / 1000);
const randomInt = Math.round(Math.random() * timestamp);

const generateCheckSign = (payload) => {
  const originalValue = [
    appId,
    timestamp,
    randomInt,
    JSON.stringify(payload),
  ].join("_");

  const hmac = crypto.createHmac("sha256", appSecret);
  hmac.update(originalValue);

  return hmac.digest("hex");
};
```

Bo test chu ky theo tai lieu SPX:

- `app-id`: `100000`
- `app-secret`: `H25HY53GO4BA2GQ`
- `timestamp`: `1677918414`
- `random-num`: `926611981`
- payload:

```json
{"user_id":239404781503925,"user_secret":"85f0d570-a265-4d9d-857e-b30aa57c4fbe","service_type":1}
```

- expected `check-sign`: `97e21b23940e4ddc96fb4d2474f02425353d2b0e23aee384f3f94c3d0b9ba17d`

Luu y: payload phai duoc stringify nhat quan. Khac khoang trang hoac line ending co the lam chu ky sai.

## Quan he cac API

### 1. Order

Can `user-id` va `user-secret` duoc tao tu API `3.1 Create Account`.

| API | Mo ta | Quan he voi API khac |
|---|---|---|
| `1.1 Get pickup timeslot` | Lay pickup timeslot kha dung cho service hien tai. | Goi truoc `1.2 Create Order` neu `collect_type` la pickup. |
| `1.2 Create Order` | Tao don theo batch, toi da 100 don/batch, tra ve waybill/tracking number. | Neu pickup, can goi `1.1 Get pickup timeslot` truoc. |
| `1.3 Track Order` | Query chi tiet don theo batch, tru thong tin phi. | Can co tracking number tu `1.2 Create Order`. |
| `1.4 Cancel Order` | Huy don theo batch. | Can co tracking number tu `1.2 Create Order`. |
| `1.5 Get AWB` | Lay waybill label theo batch, toi da 30 don/lau goi. | Can co tracking number tu `1.2 Create Order`. |

### 2. Shipping fee

Can `user-id` va `user-secret` duoc tao tu API `3.1 Create Account`.

| API | Mo ta | Quan he voi API khac |
|---|---|---|
| `2.1 Check Shipping Fee` | Lay phi ship uoc tinh truoc khi tao don, toi da 100 don/batch. | Co the goi truoc khi tao don. |
| `2.2 Get Order Fee` | Lay phi ship thuc te sau khi tao don. | Can co tracking number tu `1.2 Create Order`. |

### 3. Account

| API | Mo ta | Quan he voi API khac |
|---|---|---|
| `3.1 Create Account` | Tao account moi bang email hoac phone de sinh `user-id` va `user-secret`. | `user-id` va `user-secret` dung cho Order va Shipping fee API. |
| `3.2 Check Account Credentials` | Kiem tra credential account co hop le khong. | Nen dung de validate credential truoc khi goi Order/Shipping fee API. |

## Dia chi ho tro SPX

SPX cung cap file Excel dia chi chuan theo vung ho tro dich vu. Nen dung gia tri trong file nay cho `sender_info` va `deliver_info` khi tao don de giam loi dia chi/sai vung phuc vu.

API lay file moi nhat:

- `5.1 Get Address file download link`: https://spx.vn/en/integration/en/api/9c9f8092c25b4e259d2d1e71d3eaef75

Mapping cho Vietnam:

| Cot Excel | Field create order |
|---|---|
| `State` | `sender_state`, `deliver_state` |
| `District` | `sender_city`, `deliver_city` |
| `Ward` | `sender_district`, `deliver_district` |
| `Longitude` | `sender_longitude`, `deliver_longitude` |
| `Latitude` | `sender_latitude`, `deliver_latitude` |

Bat buoc voi Vietnam:

- `State`: Y
- `District`: Y
- `Ward`: Y
- `Longitude`: N
- `Latitude`: N

## Noi dung can bo sung tiep

### 1. Thong tin tai khoan va moi truong

- Ten doi tac/tai khoan SPX:
- `user-id`:
- `user-secret`: khong luu vao repo, chi ghi ten bien moi truong.
- Dau moi ho tro:

### 2. Tao van don

- Dieu kien tao van don:
- Payload bat buoc:
- Payload tuy chon:
- Response thanh cong:
- Response loi:
- Idempotency/retry:

### 3. Trang thai giao hang

- Danh sach trang thai SPX:
- Mapping sang trang thai don hang noi bo:
- Co che cap nhat: webhook/polling/manual
- Quy tac xu ly loi:

### 4. Van hanh

- Cach doi soat:
- Cach retry khi tao van don that bai:
- Cach huy/sua van don:
- Checklist truoc khi go production:

## Luu y ky thuat

- Khong luu credential, token, secret vao tai lieu nay.
- Khong xem gia, phi van chuyen hoac tong tien tu frontend la du lieu chinh thuc.
- Don hang noi bo phai duoc luu thanh cong truoc khi dong bo sang SPX.
- Chua trien khai cac muc `CAN XAC NHAN` cho den khi co thong tin chot.
