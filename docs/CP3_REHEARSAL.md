# Tập demo TaskHub theo P1–P3

Cập nhật 04/11/2026: kịch bản hiện hành, dữ liệu cần chuẩn bị và xử lý lỗi nằm trong [Demo CP4 0.7.3](CP4_DEMO_0_7_3.md). Lịch 6 phút là phần nhóm phân cho demo, không thay thế phần thuyết trình 15 phút và Q&A theo CP4.

## Ba vòng tập

1. Đi chậm qua từng thao tác trong workspace demo riêng. Đối chiếu tour/chỗ, công việc, phiếu và báo cáo. Chuẩn bị tour chưa khởi hành/còn chỗ; không nhập lặp cùng đợt Excel. Dữ liệu mẫu chỉ là giả lập, không phải giao dịch hay người thử thật.
2. Tập liên tục theo lịch 6 phút ở tài liệu CP4, tự ghi thời gian thực tế. Rút lời giải thích trước khi bỏ bước kiểm tra dữ liệu. Bản kịch bản hoặc ô Xong trong sheet không tự chứng minh đã tập thành công.
3. Tập tình huống mất mạng, thiếu chỗ và bản cũ. Chờ/tải lại đối chiếu trước khi gửi lại thao tác ghi. Thử chuyển sang bản local đã cài đặt và nói rõ môi trường sử dụng.

## Tự kiểm trước khi present

- [ ] Đã ghi đúng commit/tag demo và kiểm tra phiên bản public theo VALIDATION.
- [ ] Hai cửa sổ điều hành/portal cùng workspace; đăng nhập sẵn role cần demo, không dùng reviewer để sửa dữ liệu.
- [ ] Tour có nhãn giả lập, ngày/chỗ phù hợp buổi trình bày; phiếu cần đối chiếu vẫn giữ chờ.
- [ ] Mở chi tiết tour để xuất báo giá; dùng Sửa tour riêng để chỉnh dữ liệu.
- [ ] Đã thử tải `.xlsx` và In/Lưu PDF; đọc đúng phạm vi công nợ toàn không gian/bộ lọc.
- [ ] Đã thử phiếu chờ → xác nhận → ghi tổng thu → lịch sử; chỉ hủy phiếu đủ điều kiện và không còn khoản thu.
- [ ] Đã tập trọn luồng đủ thời gian và có bản local dự phòng.
- [ ] Không chiếu email raw, mật khẩu hoặc liên kết lời mời; không mở form Phản hồi MVP, Hướng dẫn hay đo bài thử đã bỏ.

## Câu hỏi cần trả lời

- Máy Tuấn tắt có dùng được không? Có, Pages và backend/database chạy trên cloud.
- Vì sao chỗ chưa đổi ngay? Polling đọc lại sau khoảng 5 giây khi tab hiển thị/có mạng; còn phụ thuộc mạng và máy chủ, chưa có SLA.
- B2B đã thanh toán và đối tác duyệt chưa? Đây là sổ nội bộ do nhân viên nhập/đối chiếu; chưa chuyển tiền hoặc phê duyệt hai phía.
- 20 tài khoản có phải 20 người không? Không. Nhóm phải đối chiếu cá nhân thật, khảo sát ngoài web và log; QA không phải bằng chứng khảo sát.
