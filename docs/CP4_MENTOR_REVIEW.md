# Bổ sung theo góp ý mentor — 27/10/2026

Phạm vi FE/BE, triển khai và bàn giao. Đây là chức năng cốt lõi của MVP, không phải xác nhận toàn bộ CP4 hoàn thành hoặc được chấp thuận Path 2. Giữ nguyên các tag demo đã phát hành.

Phạm vi hiện tại: màn **Giá trị & doanh thu** và API kế hoạch nội bộ đã được gỡ theo yêu cầu chủ dự án. Các phần giá trị, giá/gói, BMC và P&L được nhóm chuẩn bị trong tài liệu, slide và bảng tính riêng. Các đoạn về lần bổ sung ngày 27/10 là lịch sử; không dùng làm hướng dẫn mở lại chức năng đã gỡ.

## Đã bổ sung và cách demo

| Góp ý | Chức năng thực tế | Cách kiểm tra |
| --- | --- | --- |
| Quy trình rõ trách nhiệm | **Quy trình vận hành**: chuẩn bị tour → tiếp nhận khách → xác nhận chỗ ghép → đối soát thu → công việc. Số đếm lấy từ workspace đang đăng nhập. | Mở từng bước; vai trò không được đọc một mảng sẽ không nhận số đếm/nút vào mảng đó. |
| Phân vai | Chủ không gian chọn bộ phận và quyền xem/sửa khi mời nhân viên, đổi được sau đó. Menu, nút và API áp dụng cùng chính sách. | Mời tài khoản thử bằng email riêng hoặc đổi bộ phận; kiểm tra sau lần đồng bộ kế tiếp. Không tự đổi quyền của nhân viên hiện có. |
| Tin cậy đồng bộ | Thời điểm tải thành công; cảnh báo offline/dữ liệu quá 15 giây; thời gian API quan sát ở trình duyệt nội bộ. | Ngắt mạng giữ bản đọc cũ và báo mất kết nối; bật lại sẽ tải lại. Hai lần sửa cùng phiên bản không âm thầm ghi đè. |
| Giá trị, các gói và doanh thu | Công cụ kế hoạch từng được bổ sung ngày 27/10; giao diện, hàm tính và API hiện đã gỡ. Nhóm phân tích ngoài website. | Ghi rõ nguồn/ngày đo và giả định trong tài liệu; chuẩn bị BMC và Excel P&L theo đề. Không dùng doanh thu tour B2B làm doanh thu thuê bao TaskHub. |

## Chính sách vai trò

“Được sửa” chỉ cho sửa nghiệp vụ thuộc bộ phận. “Chỉ xem” khóa mọi thao tác ghi nghiệp vụ. Bộ phận khác với nghề nghiệp trong form tự đăng ký khảo sát; tài khoản tự đăng ký vẫn là chủ workspace riêng.

| Vai trò | Đọc | Ghi khi có quyền sửa |
| --- | --- | --- |
| Chủ không gian | Toàn bộ workspace | Nghiệp vụ, duyệt báo giá, mời/đổi vai/thu hồi nhân viên |
| Điều hành | Tour/chỗ, việc, tư vấn, sổ B2B | Tour/import/chỗ, công việc, tạo/xác nhận/hủy phiếu; không sửa thu hoặc trạng thái tư vấn |
| Kinh doanh | Tour/chỗ, công việc, tư vấn | Việc, trạng thái tư vấn; không nhận sổ/CSV B2B |
| Kế toán | Tour/chỗ, việc, sổ/lịch sử B2B | Tiền thu lũy kế; không sửa tour/việc/xác nhận phiếu; không nhận liên hệ tư vấn |
| Quản lý | Nghiệp vụ theo quyền | Nghiệp vụ, duyệt báo giá của người khác; không tự cấp quyền nhân viên |
| Nhân viên tổng hợp | Phạm vi nhân viên cũ | Nghiệp vụ tương thích bản cũ; không duyệt báo giá. Chủ không gian nên phân vai cụ thể. |
| Người đánh giá | Workspace được cấp | Không ghi |
| Khách chưa đăng nhập | Tour công khai | Gửi yêu cầu có đồng ý; không booking/giữ chỗ/thanh toán tự động |

Chính sách nằm ở `shared/access.mjs`. API kiểm tra mỗi request, `/api/workspace` loại mảng trái quyền và CSV có kiểm tra riêng. Đổi quyền có hiệu lực ở request tiếp theo, giao diện cập nhật sau lần tải kế tiếp. Người phụ trách công việc vẫn là tên nhập, chưa ràng buộc chỉ người được giao mới được sửa.

Migration `0004_abnormal_slipstream.sql` đã thêm hai cột `department` mặc định `general` và bảng `workspace_planning`. Bảng kế hoạch và migration cũ chỉ giữ để bảo toàn lịch sử dữ liệu; ứng dụng không còn đọc/ghi kế hoạch. Không xóa/sửa tour, tiền thu, tài khoản hoặc lịch sử migration cũ. Không khôi phục chức năng đo bài thử, xác minh email hay báo cáo AI đã bỏ.

## Đồng bộ và hiệu năng: cách trình bày có căn cứ

- Đây là polling, không phải WebSocket: kiểm tra khoảng 5 giây **sau khi lượt đọc trước hoàn tất**, khi tab hiển thị/có mạng; lỗi có thể giãn đến 30 giây. Tab ẩn/offline tạm dừng, quay lại/online tải lại.
- Ngưỡng dữ liệu cũ 15 giây là cảnh báo, không phải cam kết đồng bộ trong 15 giây. Số `ms` là lượt đọc gần nhất, gồm mạng và máy chủ, không phải p95 hoặc độ trễ end-to-end.
- Bảo vệ tối thiểu đã kiểm tra: không chồng lượt đọc nền; không tự gửi lại thao tác ghi; kiểm tra phiên bản/sức chứa trên máy chủ. Timeout không chứng minh chưa lưu: phải tải lại đối chiếu trước khi gửi lại.
- Chưa có SLA/độ trễ tối đa được đo đủ trên hosting miễn phí. Muốn cam kết trong slide, đo trên mạng/thiết bị mục tiêu, ghi kích thước dữ liệu, số người đồng thời, số lần đo, p50/p95/tỷ lệ lỗi và thời gian từ sửa đến thấy ở portal. Không biến QA thành SLA.

## Giá trị và tham khảo cách định giá

Các công thức dưới đây phục vụ phân tích ngoài website, không còn là chức năng để demo trong sản phẩm.

Giờ tiết kiệm = số thao tác × (phút trước − phút sau) / 60. Giá trị thời gian = giờ tiết kiệm × chi phí giờ. Giá trị sau phí = giá trị thời gian − phí tháng. Đây chưa phải tiền mặt/lợi nhuận tăng, chưa gồm chuyển đổi/đào tạo.

MRR dự kiến = tổng giá tháng × số doanh nghiệp của từng gói. Quy đổi năm = 12 × MRR, giữ nguyên giá/khách, chưa xét churn/chiết khấu/thuế. Thu một lần tính riêng; không lấy tiền tour B2B làm doanh thu SaaS. Khi phân tích, phân biệt dữ liệu còn thiếu với giá trị 0. Bảng tính này không thay thế Excel P&L theo đề CP4.

Trang chính thức tham khảo ngày 27/10/2026:

- [Rezdy Pricing](https://rezdy.com/pricing/): các tầng Foundation/Accelerate/Expansion kết hợp phí tháng và booking online; khác nhau về tính năng/báo cáo/tích hợp. TaskHub chưa có booking/thanh toán nên không sao chép phí giao dịch hoặc coi hai sản phẩm tương đương.
- [TravelJoy Pricing](https://traveljoy.com/pricing.html): Starter/Pro, hạn mức chuyến đi, tùy chọn thành viên và trả tháng/năm. Đây là tham khảo cấu trúc gói, không chứng minh willingness-to-pay của doanh nghiệp Việt Nam.

Không tự điền giá TaskHub, quy đổi ngoại tệ hoặc cam kết tiết kiệm X%. Nhóm cần đối chiếu giá với quan sát thời gian, chi phí phục vụ và phỏng vấn người quyết định mua. Số dùng để minh họa công thức là giả định, không phải kết quả khảo sát.

## Nhóm cần bổ sung

1. Bộ phận/quyền thực tế của từng nhân viên, ai duyệt chỗ/đối soát. Chính sách hiện tại là khung mặc định MVP.
2. Số thao tác/tháng, thời gian trước/sau cùng quy trình, chi phí nhân sự; nguồn/ngày đo và giới hạn mẫu.
3. Tên gói, tính năng/hạn mức, giá được duyệt; chi phí phục vụ và số doanh nghiệp dự kiến; dòng thu một lần nếu có dịch vụ thực tế.
4. Bằng chứng người thử thật, phỏng vấn người trả tiền, quyết định Iterate/Persevere. Không suy ra từ request QA hoặc số email.
5. Nếu chọn Path 2: xin pre-approval và nhận phản hồi giảng viên về cốt lõi công nghệ/innovation. Thêm tính năng vận hành không tự đáp ứng tiêu chí độc quyền/IP. Chưa gửi email/book lịch thay nhóm.

Theo thông báo người dùng: link book lịch lúc 19h 31/10/2026, present 06/11/2026. Nhóm tự xác nhận hạn “cuối tuần 8”, không suy đoán ngày cuối.

## Mã nguồn và chạy thử

Không thêm thư viện runtime. Phân quyền, quy trình và trạng thái đồng bộ nằm tại `shared/access.mjs`, `src/workflow-ui.jsx`, `src/sync-status.jsx`. Các module planning và API `GET /api/planning`, `PUT /api/planning` đã được gỡ. Quyền duyệt báo giá được khai báo riêng, giữ phạm vi chủ không gian và quản lý có quyền sửa.

Node 24+, `npm ci`, copy `.env.example` thành `.env` và đặt mật khẩu quản trị riêng; `npm run dev`. Bản build local: `npm run build`, `npm start`. Chi tiết README.

Kiểm tra: `npm test`; `node tests/cp4-ui.mjs` với `TEST_URL` trỏ local/cloud. Tài khoản QA tách biệt và bị xóa sau chạy, không tính là khảo sát. Đẩy `dev`, mở PR `dev → main` để chủ repo duyệt; `main` là nhánh chính, mặc định và được bảo vệ. Cập nhật Pages/backend Sites hiện có và giữ dữ liệu public.
