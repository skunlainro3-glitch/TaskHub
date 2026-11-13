# Bàn giao FE/BE TaskHub — tham chiếu CP3

Cập nhật 04/11/2026. Tài liệu CP3 cũ được rút gọn để tránh hướng dẫn thao tác trên các màn đã xóa. Trạng thái hiện hành và kịch bản nằm ở [Demo CP4 0.7.3](CP4_DEMO_0_7_3.md), [bàn giao Tuấn/Huy](CP4_TUAN_HUY_HANDOFF.md), [P1–P3/S-1–S-4](CP2_FEATURE_MAP.md) và [VALIDATION](VALIDATION.md).

Mục **Giá trị & doanh thu** và API kế hoạch nội bộ hiện đã được gỡ. Giá trị, giá/gói, BMC và P&L vẫn thuộc phần tài liệu, slide và bảng tính do nhóm chuẩn bị ngoài website; demo nghiệp vụ giữ **Quy trình vận hành** và **Báo cáo vận hành**.

Web: https://taskhub-travel.pages.dev/ · Code làm việc: https://github.com/skunlainro3-glitch/TaskHub/tree/dev. Mở PR `dev → main` để chủ repo duyệt; `main` là nhánh chính, mặc định và được bảo vệ, team không push thẳng vào `main`.

## Phần FE/BE để chứng minh

- P1: tour/lịch/chỗ dùng chung, công việc gắn tour, nhập XLSX/CSV có xem trước, thao tác nhanh và phân vai.
- P2: portal tra cứu tour đã công khai, lịch/giá/chỗ, yêu cầu tư vấn, báo giá XLSX và bản in PDF.
- P3: sổ ghép tour B2B tối giản, xác nhận chỗ, tổng thu lũy kế, lịch sử, công nợ và hủy hoàn chỗ.
- CP4: dashboard theo kỳ/quyền, workflow vận hành, phân bộ phận và xuất số liệu.
- Dữ liệu kiểm thử: log của tester đồng ý, CSV theo quyền và phản hồi lịch sử chỉ đọc. Khảo sát mới do nhóm thu bên ngoài.

Không còn Phản hồi MVP, màn Hướng dẫn, đo thời gian bài thử, xác minh email hoặc liên kết góp ý GitHub trong giao diện. Không mở lại các mục này khi tập demo. Khôi phục mật khẩu còn cần dịch vụ gửi email thực tế.

## Dữ liệu và các giới hạn

Bộ giả lập đã được chủ dự án cho phép chốt gồm 3 tour, 3 công việc và 3 phiếu B2B (2 xác nhận/1 chờ), theo [quy ước dữ liệu demo](OWNER_DEMO_DATA_2026-10-18.md). Đây không phải thông tin mở bán, giao dịch hoặc bằng chứng khảo sát. Dùng workspace demo riêng để tập ghi; giữ phiếu chưa rõ ở trạng thái chờ, không tự thay tiền/khách để luồng chạy qua.

Yêu cầu tư vấn không tự giữ chỗ hoặc xác nhận booking. B2B chưa có đối tác tự đăng nhập/duyệt, hóa đơn, chuyển tiền hoặc hoàn tiền ngân hàng. Tiền đã thu là tổng lũy kế nhập sau đối chiếu. Tên người phụ trách công việc vẫn nhập tay, chưa gửi thông báo tự động.

Portal/workspace dùng cùng nguồn và polling khoảng 5 giây sau lượt đọc trước hoàn tất khi có mạng/tab hiển thị. Có kiểm tra sức chứa, phiên bản, quyền và cảnh báo mạng/dữ liệu cũ; không công bố SLA hoặc gọi đây là đồng bộ tức thời.

## Kiểm thử, triển khai và việc của nhóm

Hướng dẫn clone, `.env`, Node 24+, chạy/build, sao lưu local và hosting ở [README](../README.md). Mã gốc FE/BE được xuất sang Workers/D1; dữ liệu cloud hoạt động khi máy chủ repo tắt. Không dùng SQLite local để ghi đè database public. Kết quả QA chỉ chứng minh tình huống đã thử; xem commit/deployment chính xác tại VALIDATION.

CP3 vẫn cần tối thiểu 20 cá nhân thật, đánh giá chức năng, raw interactions và phân tích Iterate/Persevere. Dữ liệu tự khai hoặc số email chưa tự xác minh cá nhân. Admin/reviewer xuất raw qua **Tài khoản & nhóm → Dữ liệu kiểm thử**; log UI không ghi mọi admin/reviewer/staff và có thể thiếu khi mất mạng. Không chiếu email raw hoặc commit lên GitHub. Xem [quy trình khảo sát](CP3_TESTING_GUIDE.md).

Chưa gửi thông tin reviewer hoặc cấp quyền mới cho giảng viên theo yêu cầu chủ dự án. Nhóm còn phải xác nhận Path/pre-approval, số đo thực tế, giá/gói và căn cứ tài chính, deck/BMC/P&L, buổi tập và hạn nộp. Không coi code hoàn thành là hoàn tất toàn bộ CP3/CP4 hoặc đủ innovation/IP.
