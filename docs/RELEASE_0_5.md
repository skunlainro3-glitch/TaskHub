# TaskHub 0.5 — bàn giao 19/10/2026

Đây là lịch sử phát hành 19/10. Ngày 24/10, chủ dự án yêu cầu xóa chức năng đo bài thử và xác minh email; hai chức năng này không còn trong mã hiện hành. Xem README và VALIDATION để kiểm tra trạng thái mới nhất.

Web: https://taskhub-travel.pages.dev/ · PR: https://github.com/skunlainro3-glitch/TaskHub/pull/6.

## Đã bổ sung

- Bộ mẫu tùy chọn vào không gian trống: 3 tour, 3 công việc, 3 B2B; nhãn giả lập rõ, không ghi đè dữ liệu. Bộ demo chính theo cùng quy ước, số khách 22/18/12 đã gồm 13 khách B2B xác nhận. B2B-102 cọc giả lập 8,5 triệu; TASK-03 thuộc TOUR-01.
- Mời nhân viên vào cùng không gian bằng liên kết riêng gắn email; quyền chỉ xem/được sửa, đổi quyền, thu hồi. Nhân viên không vào dữ liệu nghiên cứu; tự xóa giữ nguyên dữ liệu chung.
- Bài thử có nhiệm vụ gợi ý, nút bắt đầu/kết thúc, thời gian máy chủ và kết quả tự khai; lịch sử riêng và CSV có quyền. Thời gian gồm cả suy nghĩ/tạm dừng. Tài khoản/bài thử chưa xác minh là cá nhân thật.
- Ảnh minh họa điểm đến có nguồn và giấy phép, xử lý thiếu/lỗi ảnh. Module portal, tài khoản, bài thử được tách để nhóm dễ đọc và sửa.
- Logic xác minh email và đặt lại mật khẩu: token có hạn, một lần; reset hủy session; API công khai không lộ token. **Chưa có dịch vụ gửi thư nên web báo chưa khả dụng.** Liên kết mời sao chép thủ công vẫn dùng được.
- Hỗ trợ qua hướng dẫn, phản hồi trong ứng dụng và GitHub Issues của repo; không tạo hotline/email giả.

## Kiểm tra và phát hành

86/86 kiểm tra đạt trên SQLite và libSQL. Migration 0000–0003 áp dụng được trên D1 local; migration 0003 được phát hành bổ sung trên cloud, không sửa lịch sử cũ hay reset dữ liệu. Secrets revision 2 giữ nguyên.

API production và hai bộ trình duyệt đã đạt: portal/tìm lọc/tư vấn, tour/công việc/B2B, XLSX, feedback, reviewer; cùng nạp mẫu, thời gian thử, lời mời, quyền nhân viên, hủy lời mời và xóa staff. Các tài khoản QA tạm được xóa. Màn hình đã thử không tràn ngang ở 320/390 px; bộ demo quản trị kiểm thêm 1440 px và ảnh tải thành công, không lỗi JavaScript.

Backend Sites version 10, source `33c2390b811afc3b99f3b99af2d79de27bba1e24d`; Pages runtime source `f695f2d5ff9bf36e6181798ec0ddae228250d12a`. ID triển khai ở `cloud/site.json` và `cloud/pages/deployment.json`.

## Việc cần dữ liệu/quyền bên ngoài

1. Kết nối dịch vụ email và người gửi được xác minh nếu cần gửi email thật; không đưa token vào Git. Cấu hình trong [tài khoản và đội ngũ](ACCOUNTS_AND_TEAM.md).
2. Tuyển ít nhất 20 cá nhân thật, đối chiếu consent và cách dùng; bảng mẫu 22 dòng không thay bằng chứng này. Chưa tự chốt giá hoặc Iterate/Persevere.
3. Nhóm hoàn thành slide/BMC/lịch trình bày theo phân công. Chưa gửi credential hoặc quyền giảng viên.

## Khi bạn cùng nhóm clone

```powershell
git clone --branch main https://github.com/skunlainro3-glitch/TaskHub.git
cd TaskHub
npm ci
npm run dev
```

Cài Node.js 24 trước. Mở http://127.0.0.1:5173; dữ liệu local tách khỏi production. Hướng dẫn mã ở [CODE_GUIDE](CODE_GUIDE.md). Quy trình nhánh hiện hành: làm việc trên `main`, mở PR `main → dev` để chủ repo duyệt; `dev` vẫn là nhánh mặc định được bảo vệ, tag cũ giữ nguyên.
