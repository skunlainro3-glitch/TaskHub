# Bổ sung theo góp ý mentor — 27/10/2026

Phạm vi FE/BE, triển khai và bàn giao. Đây là chức năng cốt lõi của MVP, không phải xác nhận toàn bộ CP4 hoàn thành hoặc được chấp thuận Path 2. Giữ nguyên các tag demo đã phát hành.

## Đã bổ sung và cách demo

| Góp ý | Chức năng thực tế | Cách kiểm tra |
| --- | --- | --- |
| Quy trình rõ trách nhiệm | **Quy trình vận hành**: chuẩn bị tour → tiếp nhận khách → xác nhận chỗ ghép → đối soát thu → công việc. Số đếm lấy từ workspace đang đăng nhập. | Mở từng bước; vai trò không được đọc một mảng sẽ không nhận số đếm/nút vào mảng đó. |
| Phân vai | Chủ không gian chọn bộ phận và quyền xem/sửa khi mời nhân viên, đổi được sau đó. Menu, nút và API áp dụng cùng chính sách. | Mời tài khoản thử bằng email riêng hoặc đổi bộ phận; kiểm tra sau lần đồng bộ kế tiếp. Không tự đổi quyền của nhân viên hiện có. |
| Tin cậy đồng bộ | Thời điểm tải thành công; cảnh báo offline/dữ liệu quá 15 giây; thời gian API quan sát ở trình duyệt nội bộ. | Ngắt mạng giữ bản đọc cũ và báo mất kết nối; bật lại sẽ tải lại. Hai lần sửa cùng phiên bản không âm thầm ghi đè. |
| Giá trị | **Giá trị & doanh thu**: số thao tác/tháng, phút trước/sau, chi phí giờ, phí tháng. Chủ không gian/quản lý được sửa; người đánh giá chỉ đọc. | Kết quả âm vẫn giữ; ô chưa nhập khác 0. Ghi nguồn/ngày đo vào ô cơ sở số liệu. |
| Các gói và doanh thu | Tối đa 4 gói dự kiến, bảng đối chiếu tính năng có thật; MRR, quy đổi 12 tháng và tối đa 4 dòng thu một lần tách riêng. | Chưa có dữ liệu thì để trống. Đây là bản nháp nội bộ, không kích hoạt thu phí/giới hạn tài khoản hoặc công khai bảng giá. |
| Lưu kế hoạch | Database theo workspace, phiên bản, người/thời điểm sửa; 409 khi xung đột, giữ bản đang nhập. | Hai người cùng tải/lưu: chỉ một bản thắng cùng phiên bản. Xóa workspace xóa kế hoạch theo khóa ngoại. |

## Chính sách vai trò

“Được sửa” chỉ cho sửa nghiệp vụ thuộc bộ phận. “Chỉ xem” khóa mọi thao tác ghi nghiệp vụ. Bộ phận khác với nghề nghiệp trong form tự đăng ký khảo sát; tài khoản tự đăng ký vẫn là chủ workspace riêng.

| Vai trò | Đọc | Ghi khi có quyền sửa |
| --- | --- | --- |
| Chủ không gian | Toàn bộ workspace | Nghiệp vụ, kế hoạch, mời/đổi vai/thu hồi nhân viên |
| Điều hành | Tour/chỗ, việc, tư vấn, sổ B2B | Tour/import/chỗ, công việc, tạo/xác nhận/hủy phiếu; không sửa thu hoặc trạng thái tư vấn |
| Kinh doanh | Tour/chỗ, công việc, tư vấn | Việc, trạng thái tư vấn; không nhận sổ/CSV B2B |
| Kế toán | Tour/chỗ, việc, sổ/lịch sử B2B | Tiền thu lũy kế; không sửa tour/việc/xác nhận phiếu; không nhận liên hệ tư vấn |
| Quản lý | Nghiệp vụ và kế hoạch | Nghiệp vụ/kế hoạch; không tự cấp quyền nhân viên |
| Nhân viên tổng hợp | Phạm vi nhân viên cũ | Nghiệp vụ tương thích bản cũ, không có kế hoạch mới. Chủ không gian nên phân vai cụ thể. |
| Người đánh giá | Workspace được cấp, gồm kế hoạch | Không ghi |
| Khách chưa đăng nhập | Tour công khai | Gửi yêu cầu có đồng ý; không booking/giữ chỗ/thanh toán tự động |

Chính sách nằm ở `shared/access.mjs`. API kiểm tra mỗi request, `/api/workspace` loại mảng trái quyền và CSV có kiểm tra riêng. Đổi quyền có hiệu lực ở request tiếp theo, giao diện cập nhật sau lần tải kế tiếp. Người phụ trách công việc vẫn là tên nhập, chưa ràng buộc chỉ người được giao mới được sửa.

Migration `0004_abnormal_slipstream.sql` thêm hai cột `department` mặc định `general` và bảng `workspace_planning`. Không xóa/sửa tour, tiền thu, tài khoản hoặc lịch sử migration cũ. Không khôi phục chức năng đo bài thử, xác minh email hay báo cáo AI đã bỏ.

## Đồng bộ và hiệu năng: cách trình bày có căn cứ

- Đây là polling, không phải WebSocket: kiểm tra khoảng 5 giây **sau khi lượt đọc trước hoàn tất**, khi tab hiển thị/có mạng; lỗi có thể giãn đến 30 giây. Tab ẩn/offline tạm dừng, quay lại/online tải lại.
- Ngưỡng dữ liệu cũ 15 giây là cảnh báo, không phải cam kết đồng bộ trong 15 giây. Số `ms` là lượt đọc gần nhất, gồm mạng và máy chủ, không phải p95 hoặc độ trễ end-to-end.
- Bảo vệ tối thiểu đã kiểm tra: không chồng lượt đọc nền; không tự gửi lại thao tác ghi; kiểm tra phiên bản/sức chứa trên máy chủ. Timeout không chứng minh chưa lưu: phải tải lại đối chiếu trước khi gửi lại.
- Chưa có SLA/độ trễ tối đa được đo đủ trên hosting miễn phí. Muốn cam kết trong slide, đo trên mạng/thiết bị mục tiêu, ghi kích thước dữ liệu, số người đồng thời, số lần đo, p50/p95/tỷ lệ lỗi và thời gian từ sửa đến thấy ở portal. Không biến QA thành SLA.

## Giá trị và tham khảo cách định giá

Giờ tiết kiệm = số thao tác × (phút trước − phút sau) / 60. Giá trị thời gian = giờ tiết kiệm × chi phí giờ. Giá trị sau phí = giá trị thời gian − phí tháng. Đây chưa phải tiền mặt/lợi nhuận tăng, chưa gồm chuyển đổi/đào tạo.

MRR dự kiến = tổng giá tháng × số doanh nghiệp của từng gói. Quy đổi năm = 12 × MRR, giữ nguyên giá/khách, chưa xét churn/chiết khấu/thuế. Thu một lần tính riêng; không lấy tiền tour B2B làm doanh thu SaaS. Dữ liệu thiếu hiển thị “Chưa đủ dữ liệu”, số 0 là giá trị hợp lệ.

Trang chính thức tham khảo ngày 27/10/2026:

- [Rezdy Pricing](https://rezdy.com/pricing/): các tầng Foundation/Accelerate/Expansion kết hợp phí tháng và booking online; khác nhau về tính năng/báo cáo/tích hợp. TaskHub chưa có booking/thanh toán nên không sao chép phí giao dịch hoặc coi hai sản phẩm tương đương.
- [TravelJoy Pricing](https://traveljoy.com/pricing.html): Starter/Pro, hạn mức chuyến đi, tùy chọn thành viên và trả tháng/năm. Đây là tham khảo cấu trúc gói, không chứng minh willingness-to-pay của doanh nghiệp Việt Nam.

Không tự điền giá TaskHub, quy đổi ngoại tệ hoặc cam kết tiết kiệm X%. Nhóm cần đối chiếu giá với quan sát thời gian, chi phí phục vụ và phỏng vấn người quyết định mua. Số trong fixture QA là giả lập, không lưu vào workspace công khai của nhóm.

## Nhóm cần bổ sung

1. Bộ phận/quyền thực tế của từng nhân viên, ai duyệt chỗ/đối soát. Chính sách hiện tại là khung mặc định MVP.
2. Số thao tác/tháng, thời gian trước/sau cùng quy trình, chi phí nhân sự; nguồn/ngày đo và giới hạn mẫu.
3. Tên gói, tính năng/hạn mức, giá được duyệt; chi phí phục vụ và số doanh nghiệp dự kiến; dòng thu một lần nếu có dịch vụ thực tế.
4. Bằng chứng người thử thật, phỏng vấn người trả tiền, quyết định Iterate/Persevere. Không suy ra từ request QA hoặc số email.
5. Nếu chọn Path 2: xin pre-approval và nhận phản hồi giảng viên về cốt lõi công nghệ/innovation. Thêm tính năng vận hành không tự đáp ứng tiêu chí độc quyền/IP. Chưa gửi email/book lịch thay nhóm.

Theo thông báo người dùng: link book lịch lúc 19h 31/10/2026, present 06/11/2026. Nhóm tự xác nhận hạn “cuối tuần 8”, không suy đoán ngày cuối.

## Mã nguồn và chạy thử

Không thêm thư viện runtime. Các module mới: `shared/access.mjs`, `shared/planning.mjs`, `server/planning.mjs`, `src/workflow-ui.jsx`, `src/planning-ui.jsx`, `src/sync-status.jsx`. API `GET /api/planning`, `PUT /api/planning` nhận `{plan,version}`; workspace/quyền lấy từ phiên đăng nhập.

Node 24+, `npm ci`, copy `.env.example` thành `.env` và đặt mật khẩu quản trị riêng; `npm run dev`. Bản build local: `npm run build`, `npm start`. Chi tiết README.

Kiểm tra: `npm test`; `node tests/cp4-ui.mjs` với `TEST_URL` trỏ local/cloud. Tài khoản QA tách biệt và bị xóa sau chạy, không tính là khảo sát. Đẩy `main`, mở PR `main → dev` để chủ repo duyệt; `dev` vẫn là nhánh mặc định được bảo vệ. Cập nhật Pages/backend Sites hiện có và giữ dữ liệu public.
