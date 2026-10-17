# Deploy miễn phí: Render + Turso

**Phương án thay thế.** TaskHub đã chạy tại https://taskhub-travel.pages.dev/ với frontend Pages, backend Sites Workers và cùng D1, độc lập với máy chủ repo. Xem [PAGES_DEPLOYMENT.md](PAGES_DEPLOYMENT.md) và [CLOUD_HOSTING.md](CLOUD_HOSTING.md) cho hệ thống đang chạy. Hướng dẫn dưới đây dùng nếu nhóm chuyển sang Render/Turso; chưa triển khai dịch vụ đó.

## Cấu hình

`render.yaml` chạy FE React và BE Node.js 24 trên **Render Free**, nhánh `dev`,
region Singapore, HTTPS và health check `/api/health`. Database **Turso Free**
lưu riêng. `REQUIRE_REMOTE_DB=1` khiến server từ chối khởi động nếu thiếu
database cloud; không vô tình ghi khảo sát vào ổ đĩa tạm.

Chạy local vẫn dùng `data/taskhub.sqlite` khi không đặt `TURSO_DATABASE_URL`.
Database cloud mới được tạo rỗng và server tự tạo schema + dữ liệu demo.
Không tự import dữ liệu khảo sát CP2 hoặc dữ liệu local lên cloud.

## 1. Tài khoản

GitHub repo đã tồn tại với `dev` là nhánh chính và `build` là nhánh team sửa.
Nhánh `dev` yêu cầu review của `@skunlainro3-glitch`, CI `Validate` và giải quyết comment.
CI chạy thủ công trên tài khoản mới đã thành công ở run `38620884849`, commit
`22f3f24`. PR #1 được chủ repo duyệt và đã merge theo yêu cầu trực tiếp ngày
15/10. Không quy lỗi billing của run trên tài khoản cũ cho tài khoản mới.

1. Vào https://dashboard.render.com, Sign up → GitHub → đăng nhập skunlainro3-glitch.
   Cấp quyền kết nối **chỉ repo TaskHub** khi có lựa chọn.
2. Vào https://app.turso.tech, đăng ký bằng GitHub, chọn **Free**.
   Không bật overages hoặc nâng gói trả phí.

## 2. Database Turso

1. Trên dashboard Turso, tạo database tên `taskhub`, chọn engine **libSQL**
   nếu có lựa chọn engine; backend dùng SDK `@libsql/client`.
2. Chọn region gần Singapore / Việt Nam trong các region tài khoản hỗ trợ.
3. Sao chép database URL `libsql://...` và tạo database access token.
   Nếu có thời hạn token, chọn đủ dài cho khảo sát, thuyết trình và thời gian
   giữ dữ liệu; không để token hết giữa đợt khảo sát.
4. Dán **trực tiếp** URL/token vào biến môi trường Render ở bước sau.
   Không gửi token vào chat, commit GitHub, screenshot hay Google Docs.

Nếu dashboard chỉ hỗ trợ engine Turso mới, dừng ở bước chọn engine để kiểm
tra SDK phù hợp; không tự chuyển engine của database đang có dữ liệu.

## 3. Web Render

1. New → Blueprint → kết nối repo `skunlainro3-glitch/TaskHub` → chọn nhánh **dev**.
2. Render đọc `render.yaml`. Xác minh web service **Free**, không có disk
   trả phí và không có database Render trả phí. Tổng tiền dự kiến phải là $0.
3. Điền `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` từ Turso.
4. Điền `ADMIN_EMAIL` và mật khẩu quản trị riêng ít nhất 12 ký tự.
5. Điền `REVIEWER_EMAIL` và mật khẩu khác ít nhất 12 ký tự cho giảng viên.
   Đây là tài khoản chỉ xem. Gửi thông tin đăng nhập riêng, không ghi vào repo.
6. Apply / Deploy, chờ build và health check đạt. Mở URL `.onrender.com`
   Render cấp. Tên URL thực tế có thể khác tên service; không tự đoán URL.

Nếu Blueprint không có lựa chọn Free, tạo **New → Web Service** thủ công:
repo TaskHub, branch dev, runtime Node, region Singapore, instance Free,
build `npm ci --no-audit --no-fund && npm run build`, start
`node server/index.mjs`, health `/api/health`. Sao chép các biến trong
`render.yaml` vào Environment rồi thêm giá trị riêng của tài khoản.

Giữ `TRUST_PROXY=1` chỉ sau proxy Render. Chạy trực tiếp trên máy / VPS chưa
cấu hình proxy thì để `TRUST_PROXY=0`. Auto-deploy đặt **After CI checks pass**;
repo chỉ kết nối bằng public URL có thể cần deploy thủ công sau khi CI xanh.

## 4. Kiểm tra trước khi phát link

- `/api/health` trả `ok: true`; trang chủ hiển thị desktop/mobile.
- Đăng ký bằng dữ liệu kiểm thử; sửa số chỗ; xem cổng tour; gửi tư vấn.
- Tạo/hoàn tất công việc, gửi phản hồi; quản trị nhìn thấy kết quả.
- Reviewer xem tour, công việc, thống kê; nút sửa bị vô hiệu và API từ chối ghi.
- Redeploy một lần; dữ liệu kiểm thử vẫn còn trong Turso. Xóa tài khoản QA.
- Xuất CSV thật chỉ bằng tài khoản được cấp quyền; không tải lên repo public.

## Giới hạn miễn phí và vận hành

Render Free ngủ sau 15 phút không có request, nên lần truy cập đầu có thể
chờ máy chủ khởi động. Trước buổi giảng viên kiểm tra, mở web sớm vài phút.
Không hứa hoạt động liên tục hay tốc độ như gói trả phí; không dùng ping giả
để lách giới hạn. Dữ liệu nằm ở Turso nên việc Render ngủ/redeploy không xóa nó.
Nguồn: https://render.com/docs/free, https://render.com/docs/faq.

Nếu mục tiêu là web luôn sẵn sàng, cần chọn gói compute không ngủ sau khi
chủ tài khoản duyệt giá và chi phí định kỳ. Cấu hình hiện tại giữ Free, chưa
mua hoặc nâng gói. Gói Free phù hợp đợt thử MVP có kiểm soát; không cam kết
độ sẵn sàng của hệ thống kinh doanh. Sau khi tạo hosting thật, phải kiểm tra
đăng nhập người dùng/giảng viên, tải CSV, quyền ghi, mạng chậm và giữ dữ liệu
sau redeploy trước khi phát link.

Turso Free có hạn mức storage/đọc/ghi. Theo dõi dashboard; không bật thanh
toán hoặc nâng gói khi chưa được chủ tài khoản đồng ý. Nguồn:
https://turso.tech/pricing và https://docs.turso.tech/sdk/ts/reference.

Đây là CP3 MVP cho thử nghiệm có kiểm soát. Tour/giá mẫu cần thay bằng nội
dung đã xác minh trước khi dùng kinh doanh; tư vấn chưa phải đặt chỗ hoặc
thanh toán. Chưa có email verification hoặc khôi phục mật khẩu bằng email.

Giữ một instance cho đợt CP3. Hủy dữ liệu quá 180 ngày khi server đang chạy;
server cũng hủy dữ liệu hết hạn khi khởi động. Khi dùng database cloud,
backup/export theo Turso; `npm run data:backup` chỉ sao lưu SQLite local.
Lưu backup ngoài database chính, bảo vệ quyền truy cập và xóa backup có dữ
liệu cá nhân theo cùng thời hạn. Không restore dữ liệu đã có yêu cầu xóa.
