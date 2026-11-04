# P1–P3 và S-1–S-4 — cập nhật 04/11/2026

Web: https://taskhub-travel.pages.dev/. Bảng dưới mô tả phạm vi tính năng hiện có; các tag demo cũ được giữ nguyên. Xem [bàn giao Tuấn/Huy cho CP4](CP4_TUAN_HUY_HANDOFF.md) để dùng đúng bản demo và kịch bản mới, [xác nhận kiểm tra](VALIDATION.md) để biết bản phát hành đã được kiểm chứng.

Từ **0.7.2**, web gỡ menu/form Phản hồi MVP và câu hỏi mức sẵn sàng trả theo yêu cầu chủ dự án. CP3 vẫn cần phản hồi và log gốc; khảo sát được thực hiện bằng công cụ bên ngoài do nhóm cung cấp. Không tạo hoặc công bố link khảo sát mới trong đợt này. Log thao tác và bản xuất dữ liệu phản hồi lịch sử chỉ đọc theo quyền admin/reviewer vẫn giữ, không xóa dữ liệu đã thu.

## Pain → tính năng → cách chứng minh

| Pain CP2 | Tính năng để demo trực tiếp | Thao tác và dấu hiệu đúng | Giới hạn |
| --- | --- | --- | --- |
| **P1: thông tin rời rạc, thất lạc, khó theo dõi** | Nguồn tour dùng chung, công việc gắn tour, nhập Excel, thao tác nhanh | Nhập XLSX/CSV hoặc dùng danh mục đã có nguồn; đổi số khách ngay trên thẻ tour; tạo việc và đổi trạng thái. Ngày, giá và số chỗ trên portal khớp dữ liệu điều hành. Mở Quy trình vận hành để giải thích bàn giao giữa các bộ phận. | Người phụ trách công việc là tên nhập; nhân viên được phân bộ phận và quyền xem/sửa. Chưa tích hợp Zalo hoặc thông báo tự gửi. |
| **P2: khách cần thông tin ngoài giờ** | Public Tour Portal trên cloud; tìm/lọc, chi tiết, yêu cầu tư vấn, báo giá Excel và bản in | Mở cổng riêng của tour đã công khai, tra cứu và gửi yêu cầu; bộ phận được cấp quyền thấy yêu cầu mới. Báo giá lấy từ thông tin tour đang xem. Web không phụ thuộc máy của Tuấn bật. | Không phải booking, không giữ chỗ, không thanh toán hoặc tự gửi email. PDF dùng hộp thoại In/Lưu PDF của trình duyệt. Không cam kết SLA. |
| **P3: lệch số khách và đối soát khi ghép tour** | Sổ B2B tối giản: phiếu đối tác, xác nhận chỗ, tiền đã thu/còn phải thu, lịch sử, CSV/Excel và bản in | Tạo phiếu: chỗ chưa đổi. Xác nhận: số khách trong tour tăng, chỗ trên portal giảm. Ghi nhận tổng tiền đã thu: số còn phải thu thay đổi. Hủy phiếu đã đối soát về 0: trả lại đúng số chỗ một lần. Điều hành xác nhận chỗ; kế toán ghi thu theo quyền. | Điều hành nhập thỏa thuận; chưa có đối tác đăng nhập/tự duyệt, mạng lưới ghép liên doanh nghiệp hoặc xác nhận dịch vụ hai phía. Sổ thu không xác minh ngân hàng. |

## Mức hoàn thành các giải pháp CP2

| Giải pháp | Mức hoàn thành của MVP | Còn thiếu để giải pháp đầy đủ |
| --- | --- | --- |
| **S-1 — Public Tour Portal** | Đã có luồng cốt lõi: tra cứu ngoài giờ, lịch/giá/chỗ, yêu cầu tư vấn. Portal chỉ hiển thị tour do điều hành công khai; 13 nội dung Én Việt chỉ giữ trong danh mục nội bộ để tạo nháp. | Booking/thanh toán tự động, chatbot và các tình huống cần con người. |
| **S-2 — Điều hành tập trung** | Đã có tour/lịch/chỗ, tạo/sửa/xóa việc có kiểm tra phiên bản, lọc quá hạn/ưu tiên, nhập XLSX/CSV và thao tác nhanh trên thẻ. | Thông báo tự gửi; quản lý nhà cung cấp và net price/markup toàn bộ tour. Giá net B2B hiện chỉ nằm trên từng phiếu ghép. |
| **S-3 — Tour-pooling và đối soát B2B** | **Đã có bản tối giản để demo P3:** tạo phiếu → xác nhận → giữ chỗ → ghi nhận thu/còn phải thu → lịch sử ai/lúc nào/số trước-sau → CSV/Excel, bản in và hủy hoàn chỗ. Có thống kê theo kỳ trong Báo cáo vận hành. | Đối tác tự xác nhận, hồ sơ/hợp đồng, hóa đơn và thanh toán/hoàn tiền thực tế; không gọi đây là B2B hoàn chỉnh. |
| **S-4 — Điều chỉnh chiến lược thu phí** | Bộ câu hỏi đánh giá từng tính năng đã bàn giao cho An; công cụ offline đọc CSV bên ngoài hoặc bản xuất lịch sử. Web không còn thu willingness-to-pay. Bản nháp nội bộ Giá trị & doanh thu vẫn dùng để nhập giả định nhóm cung cấp. | Nhóm cung cấp công cụ khảo sát ngoài web, xác minh tối thiểu 20 cá nhân thật, phân tích mẫu, phỏng vấn người quyết định và chốt giá/Iterate–Persevere. Paid pilot vẫn là hướng tiếp theo. Không có kết luận thị trường từ dữ liệu QA hoặc bảng tính giả định. |

## Phần bổ sung cho CP4

- **Phân vai:** Kinh doanh, Điều hành, Kế toán, Quản lý và quyền chỉ xem/được sửa; chủ không gian quản lý lời mời. Menu và API cùng áp dụng chính sách trong `shared/access.mjs`.
- **Báo cáo vận hành:** lọc kỳ theo ngày khởi hành/hạn việc/ngày gửi tư vấn, hiển thị số tour, khách đã giữ, tỷ lệ lấp đầy, công việc và sổ B2B theo quyền. Không coi tiền tour là doanh thu thuê bao TaskHub.
- **Xuất tệp:** Excel `.xlsx` thật cho báo giá/công nợ/báo cáo. PDF dùng In/Lưu PDF qua trình duyệt. Bản in công nợ theo bộ lọc; Excel/CSV công nợ xuất toàn không gian như hướng dẫn trên màn hình.
- **Ảnh:** WebP 480/960 px cho ảnh nguồn hiện có; nguồn 404 được thay bằng minh họa có nhãn. Tối ưu kích thước ảnh không đồng nghĩa đã đo hoặc cam kết tốc độ 4G.

## Các thao tác gần 1–2 chạm

- Chọn nội dung tour: mở **Danh mục Én Việt** → **Dùng tour**. Ngày/chỗ/lịch từng ngày vẫn phải nhập vì nguồn chưa có.
- Cập nhật khách: **Đổi số chỗ** → nhập số → **Lưu số khách**. Hai nút thao tác, không tính việc gõ dữ liệu.
- Giao việc: nút **Giao việc** ngay trên thẻ tour, tour đã được chọn sẵn.
- Đổi trạng thái công việc hoặc xác nhận phiếu ghép: một điều khiển.
- Nhập hàng loạt: **Nhập Excel** → chọn tệp → xem lỗi/xem trước → **Nhập**. Cố ý giữ bước xem trước để tránh ghi sai hàng loạt; không tuyên bố mọi form chỉ cần hai chạm.

## Log để đối chiếu

Tài khoản người thử đã đồng ý có log nghiệp vụ và `ui_click`/`ui_change` cho nút, menu, lựa chọn. CSV riêng có email và thời gian server; trường `entity` của log UI chứa mã điều khiển, khu vực và thời gian thiết bị (có thể lệch đồng hồ). Không ghi giá trị gõ, mật khẩu, tên tệp hoặc nội dung biểu mẫu. Admin/reviewer/nhân viên không tính vào khảo sát. Log UI có thể bị thiếu khi mất mạng/đóng trình duyệt đột ngột; không dùng số lần bấm thay cho số người thử.

## Bổ sung bản 0.5

- Bộ mẫu tùy chọn 3 tour/3 việc/3 phiếu; hai phiếu xác nhận đã gồm trong số khách 22/18, phiếu thứ ba chờ chưa giữ chỗ. Tất cả là giả lập.
- Log nút/menu và thời điểm bấm phục vụ dữ liệu thao tác gốc CP3. Từ 24/10, không còn chức năng bắt đầu/kết thúc hay thống kê thời gian bài thử.
- Ảnh minh họa có nguồn/giấy phép; fallback trung tính khi thiếu ảnh.
- Khôi phục mật khẩu giữ token an toàn; gửi thư thực tế còn cần nhà cung cấp. Xác minh email đã được xóa theo yêu cầu chủ dự án.
