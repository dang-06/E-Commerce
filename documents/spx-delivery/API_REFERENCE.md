# SPX API Reference

Tai lieu nay tom tat cac API SPX da nhan duoc de lam can cu tich hop. Khong luu `app-secret`, `user-secret` that trong repository.

## Quy uoc chung

- Host test VN: `https://test-stable.spx.vn/`
- Host live VN: `https://spx.vn/`
- Method: `POST`
- Encoding: UTF-8
- Body: JSON
- Content-Type: `Application/JSON`
- Header bat buoc: `app-id`, `check-sign`, `timestamp`, `random-num`
- `timestamp` dung Unix timestamp theo giay.
- `check-sign` tao bang HMAC-SHA256 theo huong dan trong `README.md`.

## Tong quan endpoint

| Ma | API | Endpoint | Batch/Gioi han | Ghi chu |
|---|---|---|---|---|
| 1.1 | Get Pickup Timeslot | `/open/api/v1/order/get_pickup_time` | - | Lay pickup time truoc khi tao don pickup. |
| 1.2 | Create Order | `/open/api/v1/order/batch_create_order` | Toi da 100 don/batch | Tao don dong bo, tra tracking number. |
| 1.3 | Track Order | `/open/api/v1/order/batch_search_order` | Toi da 100 don/batch | Query chi tiet don, khong gom thong tin phi. |
| 1.4 | Cancel Order | `/open/api/v1/order/batch_cancel_order` | Toi da 100 don/batch | Huy don da tao thanh cong. |
| 1.5 | Get AWB | `/open/api/v1/order/batch_get_shipping_label` | Theo tai lieu moi nhan: toi da 100/batch | Lay link in waybill label theo tracking number. |
| 1.6 | Create Order V2 | `/open/api/v2/order/batch_create_order` | Toi da 100 don/batch | Tao don bat dong bo, tra `batch_no`. |
| 1.7 | Get Order Create Result V2 | `/open/api/v2/order/get_order_create_result` | 1 `batch_no`/request | Lay ket qua tao don V2, khi done moi co tracking number. |
| 1.8 | Get AWB V2 | `/open/api/v2/order/batch_get_shipping_label` | Theo `batch_no` | Lay label theo batch V2. |
| 1.9 | Update Order | `/open/api/v1/order/batch_update_order` | Toi da 100 don/batch | Deprecated, nen dung 1.11. |
| 1.11 | Update Order V2 | `/open/api/v2/order/update_order` | - | API thay the 1.9. |
| 1.12 | Confirm Order | `/open/api/v1/order/confirm_order` | 1 tracking/request | Confirm return hoac re-attempt. |
| 2.1 | Check Shipping Fee | `/open/api/v1/order/batch_check_order` | Toi da 100 don/batch | Lay phi uoc tinh truoc khi tao don. |
| 2.2 | Get Order Fee | `/open/api/v1/order/batch_get_asf` | Toi da 100 don/batch | Lay phi thuc te sau khi tao don. |
| 2.3 | Estimate Address Adjustment Fee | `/open/api/v1/order/estimate_address_adjustment_fee` | 1 tracking/request | Uoc tinh phi dieu chinh dia chi sau khi tao don. |
| 3.1 | Create Account | `/open/api/v1/account/create` | - | Tao `user_id` va `user_secret`. |
| 3.2 | Check Account Credentials | `/open/api/v1/account/verify` | - | Kiem tra `user_id`/`user_secret`. |
| 5.1 | Get Address File Download Link | `/open/api/address/get_address_download_url` | - | Lay link Excel dia chi chuan moi nhat. |

## 1. Order APIs

### 1.1 Get Pickup Timeslot

Dung de lay pickup time kha dung cho service hien tai.

Request body:

| Field | Type | Bat buoc | Ghi chu |
|---|---|---|---|
| `user_id` | integer | Y | Sinh tu 3.1 Create Account hoac SPX cap. |
| `user_secret` | string | Y | Secret tu account SPX, khong luu trong repo. |
| `service_type` | integer | Y | `1`: standard service, `2`: instant service. |

Response chinh:

- `ret_code`, `message`
- `data[]`
- `data[].date`
- `data[].pickup_time`: timestamp dung cho `fulfillment_info.pickup_time`
- `data[].slots[].pickup_time_range_id`
- `data[].slots[].pickup_time_range`

VN pickup range example: `10h den truoc 19h`.

### 1.2 Create Order V1

Dung de tao don theo batch. Neu thanh cong tra tracking number.

Request body cap cao:

| Field | Type | Bat buoc | Ghi chu |
|---|---|---|---|
| `user_id` | integer | Y | SPX account id. |
| `user_secret` | string | Y | SPX account secret. |
| `orders` | list | Y | Toi da 100 don. |
| `orders[].order_id` | string | N | Ma don tren he thong minh, max 32 ky tu. |
| `orders[].base_info` | object | Y | Gom `service_type`. |
| `orders[].sender_info` | object | Y | Dia chi nguoi gui. |
| `orders[].fulfillment_info` | object | Y | Thanh toan, COD, pickup/dropoff. |
| `orders[].deliver_info` | object | Y | Dia chi nguoi nhan. |
| `orders[].parcel_info` | object | Y | Thong tin kien hang. |

Field quan trong:

- `base_info.service_type`: `1` standard, `2` instant.
- `sender_state`, `sender_city`, `sender_district`: voi VN bat buoc province/district/ward.
- `sender_phone`: voi VN 8/10 chu so neu dau `1800`/`1900`, 10-11 chu so neu dau `0`, 11-12 chu so neu dau country code `84`.
- `fulfillment_info.payment_role`: `1` sender pay, `2` receiver pay.
- `fulfillment_info.cod_collection`: `0` no, `1` yes.
- `fulfillment_info.cod_amount`: bat buoc khi COD, VN integer, limit <= 20,000,000 VND.
- `fulfillment_info.high_value_processing_collection`: `0` no, `1` yes; VN required as `1` khi insured value >= 3,000,000.
- `fulfillment_info.collect_type`: `1` pickup, `2` drop off.
- Neu pickup, can `pickup_time`, `pickup_time_range_id`, va nen goi lai 1.1 truoc khi tao don de tranh qua cutoff.
- VN support: `allow_mutual_check`, `allow_try_on`, `allow_partial_delivery`.

Response chinh:

- `ret_code`, `message`
- Danh sach don tao thanh cong voi `order_id`, `tracking_no`, `tracking_link`
- Danh sach loi theo tung don neu co
- Phi uoc tinh co the duoc tra ve tuy response: `estimated_shipping_fee`, `basic_shipping_fee`, `cod_service_fee`, `high_value_processing_fee`, `vat_fee`, `voucher_shipping_fee`

### 1.3 Track Order

Dung de query chi tiet don, tru thong tin lien quan den phi.

Request body:

| Field | Type | Bat buoc | Ghi chu |
|---|---|---|---|
| `user_id` | integer | Y | SPX account id. |
| `user_secret` | string | Y | SPX account secret. |
| `tracking_no_list` | list | N | Tracking number tu create order. Optional neu gui `batch_no`. |
| `order_id_list` | list | N | Ma don tren he thong minh. Optional neu gui `batch_no`. |
| `batch_no` | integer | N | Batch number tu Create Order V2. |

Response chinh:

- `orders[].tracking_no`
- `orders[].tracking_link`
- `orders[].order_id`
- `orders[].status`
- `orders[].status_code`
- `orders[].base_info`
- `orders[].sender_info`
- `orders[].deliver_info`
- `orders[].parcel_info`

### 1.4 Cancel Order

Dung de huy don da tao thanh cong.

Request body:

| Field | Type | Bat buoc | Ghi chu |
|---|---|---|---|
| `user_id` | integer | Y | SPX account id. |
| `user_secret` | string | Y | SPX account secret. |
| `tracking_no_list` | list | Y | Tracking number tu create order. |

Response chinh:

- `data.tracking_no_list`: tracking number huy thanh cong
- `data.fail_list[]`: danh sach huy that bai, gom `ret_code`, `message`, `tracking_no`

### 1.5 Get AWB V1

Dung de lay link waybill label theo tracking number.

Request body:

| Field | Type | Bat buoc | Ghi chu |
|---|---|---|---|
| `user_id` | integer | Y | SPX account id. |
| `user_secret` | string | Y | SPX account secret. |
| `tracking_no_list` | list | Y | Tracking number tu create order. |

Luu y:

- Chi in duoc don chua bi huy.
- Link label co hieu luc trong 30 phut.
- Link mo toi da 10 lan.

Response chinh:

- `data.awb_link`
- `data.fail_list[]`

### 1.6 Create Order V2

Dung de tao don bat dong bo theo batch. Thanh cong tra `batch_no`, can goi 1.7 hoac nhan webhook de lay tracking.

Request body tuong tu 1.2:

- `user_id`
- `user_secret`
- `orders[]`, toi da 100 don
- `order_id`
- `base_info`
- `sender_info`
- `fulfillment_info`
- `deliver_info`
- `parcel_info`

Response chinh:

- `data.batch_no`
- `data.task_status`: `1` New, `2` Waiting, `3` Running, `4` Done, `5` Failed
- `data.description`
- `data.total_count`, `success_count`, `fail_count`, `progress`

### 1.7 Get Order Create Result V2

Dung de lay ket qua tao don khi da dung Create Order V2. Chi support mot `batch_no` moi request.

Request body:

| Field | Type | Bat buoc | Ghi chu |
|---|---|---|---|
| `user_id` | integer | Y | SPX account id. |
| `user_secret` | string | Y | SPX account secret. |
| `batch_no` | integer | Y | Batch number tu 1.6. |

Response chinh:

- `batch_no`
- `task_status`
- `description`
- `total_count`, `success_count`, `fail_count`, `progress`
- `orders[]` khi task done: `order_id`, `tracking_no`, `tracking_link`, sort code neu duoc bat
- Phi uoc tinh: `estimated_shipping_fee`, `basic_shipping_fee`, `cod_service_fee`, `high_value_processing_fee`, `vat_fee`, `voucher_shipping_fee`, `collect_fee_service_fee`

### 1.8 Get AWB V2

Dung de lay waybill label theo `batch_no`.

Request body:

| Field | Type | Bat buoc | Ghi chu |
|---|---|---|---|
| `user_id` | integer | Y | SPX account id. |
| `user_secret` | string | Y | SPX account secret. |
| `batch_no` | integer | Y | Batch number tu 1.6. |

Response chinh:

- `batch_no`
- `task_status`: `1` New, `2` Waiting, `3` Running, `4` Done, `5` Failed
- `total_order_count`, `total_print_count`, `success_print_count`, `progress`
- `awb_link` khi done
- `orders[]`: `order_id`, `tracking_no`

### 1.9 Update Order V1

Dung de cap nhat thong tin don theo batch, toi da 100 don/batch. Theo tai lieu SPX, API nay deprecated va nen dung 1.11 Update Order V2.

Endpoint: `/open/api/v1/order/batch_update_order`

### 1.11 Update Order V2

Dung de cap nhat thong tin don, thay the 1.9.

Endpoint: `/open/api/v2/order/update_order`

Luu y tu tai lieu:

- Neu cap nhat pickup, pickup time nen lay qua 1.1.
- Nen check lai pickup time truoc khi update/create de tranh loi qua cutoff.
- `pickup_time_range_id` lay tu 1.1.
- Mot so option nhu mutual check/try on/partial delivery chi support VN.

### 1.12 Confirm Order

Dung de confirm order.

Request body:

| Field | Type | Bat buoc | Ghi chu |
|---|---|---|---|
| `user_id` | integer | Y | SPX account id. |
| `user_secret` | string | Y | SPX account secret. |
| `tracking_no` | string | Y | SPX tracking number. |
| `operation` | integer | Y | `1`: return, `2`: re-attempt. |

Response chinh:

- `data.tracking_no`
- `data.operation_result`: `1` success, `2` failed

## 2. Shipping Fee APIs

### 2.1 Check Shipping Fee

Dung de lay phi ship uoc tinh truoc khi tao don, toi da 100 don/batch.

Endpoint: `/open/api/v1/order/batch_check_order`

Request body cap cao:

- `user_id`
- `user_secret`
- `orders[]`
- `base_info`
- `sender_info`
- `fulfillment_info`
- `deliver_info`
- `parcel_info`

Response chinh:

- `orders[].order_id`
- `orders[].estimated_shipping_fee`
- `orders[].basic_shipping_fee`
- `orders[].cod_service_fee`
- `orders[].high_value_processing_fee`
- `orders[].vat_fee`
- `orders[].voucher_shipping_fee`
- `fail_list[]`

### 2.2 Get Order Fee

Dung de lay phi ship thuc te sau khi tao don, toi da 100 tracking/batch.

Request body:

| Field | Type | Bat buoc | Ghi chu |
|---|---|---|---|
| `user_id` | long | Y | SPX account id. |
| `user_secret` | string | Y | SPX account secret. |
| `tracking_no_list` | list | Y | Tracking number tu create order. |

Response chinh:

- `orders[].tracking_no`
- `orders[].parcel_info.actual_weight`
- `orders[].parcel_info.chargeable_weight`
- `orders[].fee_info.payment_status`: `1` Created, `2` Collected, `3` Cancelled, `4` Failed, `5` Settled
- `orders[].fee_info.payment_role`: `1` sender pay, `2` receiver pay
- `orders[].fee_info.actual_shipping_fee`
- `orders[].fee_info.return_shipping_fee`
- `orders[].fee_info.basic_shipping_fee`
- `orders[].fee_info.cod_service_fee`
- `orders[].fee_info.voucher_shipping_fee`
- `orders[].deliver_info.actual_distance`
- `fail_list[]`

### 2.3 Estimate Address Adjustment Fee

Dung de tinh phi dich vu dieu chinh dia chi sau khi tao don.

Request body chinh:

- `user_id`
- `user_secret`
- `tracking_no`
- `sender_state`, `sender_city`, `sender_district`, `sender_post_code`, `sender_detail_address`
- `deliver_state`, `deliver_city`, `deliver_district`, `deliver_post_code`, `deliver_detail_address`
- `sender_longitude`, `sender_latitude`, `deliver_longitude`, `deliver_latitude`
- `sender_address_version`, `deliver_address_version`

VN note:

- `sender_district` va `deliver_district` mandatory neu dung dia chi 3 cap.
- `sender_post_code` optional voi VN theo tai lieu, nhung `deliver_post_code` trong phan 2.3 duoc danh dau Y; can test sandbox/xac nhan voi SPX.

Response chinh:

- `tracking_no`, `tracking_link`, `order_id`, `order_id_link`
- `estimated_shipping_fee`
- `basic_shipping_fee`
- `address_adjustment_fee`
- `cod_service_fee`
- `high_value_processing_fee`
- `vat_fee`
- `voucher_shipping_fee`
- cac fee dich vu khac neu ap dung

## 3. Account APIs

### 3.1 Create Account

Dung de tao account bang phone/email va sinh `user_id`, `user_secret`.

Endpoint: `/open/api/v1/account/create`

Request body:

| Field | Type | Bat buoc | Ghi chu |
|---|---|---|---|
| `phone` | string | Y | Max length 32. |
| `email` | string | N | Max length 64. |

Response chinh:

- `data.user_id`
- `data.user_secret`

### 3.2 Check Account Credentials

Dung de kiem tra `user_id` va `user_secret` co hop le khong.

Endpoint: `/open/api/v1/account/verify`

Request body:

| Field | Type | Bat buoc | Ghi chu |
|---|---|---|---|
| `user_id` | integer | Y | SPX account id. |
| `user_secret` | string | Y | SPX account secret. |

Response chinh:

- `data.match_result`: `true` matched, `false` unmatched

## 4. Webhooks

Webhook do SPX goi ve public URL cua minh. SPX ky body bang `app-secret` va gui `check-sign` trong header. Ben minh phai tinh lai chu ky va so sanh truoc khi xu ly.

Bat buoc return HTTP `200` trong 3 giay. Nen ack 200 truoc, sau do dua event vao queue/job noi bo de xu ly.

### 4.1 Tracking Web Hook

Dung de nhan trang thai hien tai cua don khi status thay doi.

Field chinh:

- `status`, `status_code`, `message`
- `tracking_no`, `tracking_link`
- `order_id`, `order_id_link`
- `id`, `timestamp`
- `latest_shipping_fee`, `latest_chargeable_weight`, `cod_amount`
- `actual_return_shipping_fee`
- `driver_phone_number` voi VN trong trang thai delivery
- sender/deliver address fields
- `proof_of_delivery_list`
- `edd_min`, `edd_max`

Vi du status:

- `1001`: Pending Pickup
- `2001`: In Transit
- `5001`: Pickup Failed
- `6003`: co lien quan return fee theo note tai lieu
- `7001`: latest shipping fee khong return theo note tai lieu

### 4.2 Order Create Web Hook

Dung khi tao don bang Create Order V2, push tien do tao batch.

Field chinh:

- `batch_no`
- `task_status`: `1` New, `2` Waiting, `3` Running, `4` Done, `5` Failed
- `description`
- `total_count`, `success_count`, `fail_count`
- `progress`

### 4.3 Order Create Feedback Web Hook

Dung khi tao don bat dong bo hoan tat.

Field chinh:

- `tracking_no`
- `consignment_no`
- `order_id`
- `r_first_sort_code`
- `r_third_sort_code`
- `r_fifth_sort_code`
- `return_first_sort_code`

### 4.4 Reverse Order Create Feedback

Dung khi reverse order tao thanh cong.

Field chinh:

- `forward_tracking_no`
- `reverse_tracking_no`
- `reverse_tracking_link`

### 4.5 Ticket Webhook

Dung khi ticket status thay doi.

Field chinh:

- `ticket_id`
- `account_id`/`user_id`
- `tracking_no`
- `escalation_er`
- `ticket_status`: `1` created, `2` reviewing, `3` resolved, `4` cancelled
- `on_hold_reason_id`, `on_hold_reason`
- `ticket_create_time`, `ticket_aging_time`, `pending_response_time`

### 4.6 Shipping Fee Webhook

Dung khi phi ship cua don thay doi.

Field chinh:

- `tracking_no`, `tracking_link`
- `order_id`, `order_id_link`
- `id`, `timestamp`
- `latest_chargeable_weight`, `latest_actual_weight`
- `latest_shipping_fee`
- `latest_actual_basic_shipping_fee`
- `latest_actual_cod_service_fee`
- `actual_return_shipping_fee`
- `collect_fee_status`: `1` not collected, `2` collected
- `collect_fee_amount`

### 4.7 Evidence Proofs Webhook

Dung de nhan proof/evidence giao nhan.

Field chinh:

- `tracking_no`
- `customer_order_id`
- `id`
- `epod_list`: Proof of Delivery URLs
- `epop_list`: Proof of Pickup URLs
- `epor_list`: Proof of Return URLs
- `epooh_list`: Proof of Other Handling URLs
- `tracking_code_name`
- `status`
- `status_code_name`

## 5. Address API

### 5.1 Get Address File Download Link

Dung de lay link Excel dia chi chuan moi nhat.

Endpoint: `/open/api/address/get_address_download_url`

Request body:

```json
{}
```

Response chinh:

- `data.address_download_url`

Ghi chu: dia chi trong Excel nen duoc dung cho `sender_info` va `deliver_info` khi create order.

## Luong goi API de tao van don

### V1 dong bo

1. Kiem tra/tai dia chi chuan bang 5.1 neu chua co cache.
2. Neu chua co `user_id`/`user_secret`, tao bang 3.1 hoac nhan tu SPX.
3. Kiem tra credential bang 3.2.
4. Neu `collect_type = 1` pickup, goi 1.1 de lay `pickup_time` va slot.
5. Co the goi 2.1 de lay phi uoc tinh.
6. Goi 1.2 Create Order.
7. Luu `tracking_no`, `tracking_link`, fee uoc tinh va raw response da redact.
8. Goi 1.5 lay AWB khi can in label.
9. Theo doi trang thai bang 4.1 webhook hoac 1.3 polling.
10. Goi 2.2 de lay phi thuc te sau khi tao don neu can doi soat.

### V2 bat dong bo

1. Lam cac buoc chuan bi nhu V1.
2. Goi 1.6 Create Order V2 de lay `batch_no`.
3. Luu `batch_no` vao integration job.
4. Nhan 4.2/4.3 webhook hoac goi 1.7 de lay ket qua.
5. Khi task done, luu `tracking_no`, `tracking_link`.
6. Goi 1.8 lay AWB theo `batch_no` khi can.

## Luu y tich hop vao he thong hien tai

- Backend phai luu order noi bo va integration job trong PostgreSQL truoc khi goi SPX.
- Khong dung phi ship frontend gui len lam phi chinh thuc.
- `order_id` gui sang SPX nen dung ma don noi bo va phai on dinh de doi soat.
- Moi response/error log can redact `user_secret`, `app-secret`, phone va thong tin nhay cam.
- Webhook can idempotent theo `id` neu co, hoac theo cap `tracking_no` + `status_code` + `timestamp`.
- Nen bat dau bang sandbox va mock adapter; chi enable production khi da co credential live va da test day du.
