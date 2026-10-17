# Địa chỉ Cloudflare Pages cho TaskHub

**Web công khai:** https://taskhub-travel.pages.dev/ — đã phát hành ngày 15/10/2026 trên Cloudflare Pages Free. Project `taskhub-travel`, production branch `dev`; deployment/SHA được ghi trong `cloud/pages/deployment.json`. Backend Sites version 2 và database hiện có được giữ nguyên; ID/SHA backend ở `cloud/site.json`.

Pages phục vụ giao diện React/Vite của repo. `/api/*` đi qua gateway có chữ ký tới backend Sites hiện tại; dữ liệu vẫn ở cùng D1. Không tạo database thứ hai hoặc nhập/xóa dữ liệu khảo sát khi đổi địa chỉ. Cả Pages và backend đều chạy trên cloud, độc lập với máy chủ repo. URL cũ vẫn truy cập được; đăng nhập lại khi chuyển sang hostname mới vì cookie được giới hạn theo hostname.

## Tài khoản và lần phát hành tiếp theo

1. Chủ dự án đã xác nhận kết nối Cloudflare với các scope `account:read`, `user:read`, `pages:write` và refresh session. Khi cần đăng nhập lại, dùng **Wrangler 4.151.0 Device Authorization** để tránh callback localhost: `npx wrangler@4.151.0 login --device --scopes account:read user:read pages:write`. Chủ tài khoản phải đồng ý cấp quyền; không chia sẻ mật khẩu/OTP qua chat. Credentials không nằm trong repo.
2. Đảm bảo backend Sites đã phát hành adapter hỗ trợ gateway và có secret runtime `TASKHUB_PROXY_SECRET`. Giữ nguyên Site ID và D1 trong `cloud/site.json`. Bản export nằm trong `scripts/export-sites.mjs`; không đổi database hoặc migration đã áp dụng.
3. Tại repo TaskHub, dùng Node.js 24:

   ```powershell
   npm ci
   npm test
   npm run build:pages
   ```

   Project đã tồn tại; không tạo lại. Dùng Wrangler **4.92.0** đã kiểm thử cho các lệnh Pages create/deploy/secret. Wrangler 4.151.0 tự chuyển một số lệnh Pages sang Workers; không dùng sự chuyển đổi đó cho project `.pages.dev` này. Phân tách phiên bản login/deploy không đổi quyền tài khoản.

4. Dùng `wrangler pages secret bulk` để đặt **cùng** secret trong project Pages trước khi deploy. Bản private trên máy chủ repo là `work/pages-proxy/secrets.json`, được bỏ khỏi Git. Không in giá trị ra chat, không commit, không đưa secret vào build/frontend. Khi dùng CI, lưu token triển khai trong GitHub Actions secrets và giới hạn theo account/Pages; chưa cấu hình CI tự deploy khi chưa có quyền tài khoản.

   ```powershell
   Get-Content -Raw -LiteralPath 'work/pages-proxy/secrets.json' | npx wrangler@4.92.0 pages secret bulk --project-name taskhub-travel
   npx wrangler@4.92.0 pages deploy dist-pages --project-name taskhub-travel --branch dev
   ```

5. Kiểm tra trên URL production https://taskhub-travel.pages.dev/: đăng ký → sửa tour → cổng khách hàng → gửi yêu cầu → công việc → phản hồi; kiểm tra reviewer và CSV. Chạy `npm run test:cloud` với `TEST_URL` trỏ tới Pages và admin/reviewer credentials lấy từ môi trường private. Dọn tài khoản QA của mình sau kiểm thử. Gửi link production cho nhóm/người khảo sát; hostname deployment riêng phục vụ truy vết vận hành.

Direct Upload không chuyển trực tiếp sang Git integration được. Có thể dùng GitHub Actions + Wrangler để deploy nhánh `dev` đã duyệt, hoặc chọn Git integration ngay từ đầu nếu chủ tài khoản muốn cấp quyền ứng dụng GitHub. Không cần mua domain, thêm thẻ hoặc nâng gói để làm bước này.

## Bảo vệ đường API

- Gateway kiểm tra Origin của trình duyệt **trước** khi chuyển tới backend, chỉ chuyển cookie `taskhub_session`, giữ Secure/HttpOnly/SameSite và trạng thái lỗi API.
- IP từ Cloudflare được ký HMAC cùng method/path/query/thời gian; backend chỉ dùng IP đó khi chữ ký còn hạn và đúng secret. Cách này tránh gom mọi tester vào một IP Worker chung và không tin header IP do trình duyệt tự gửi.
- Request body tối đa 32 KiB. API không cache và không tự gửi lại thao tác ghi khi mạng lỗi. Admin/reviewer secret vẫn chỉ nằm ở backend Sites.
- Không tắt backend Sites khi Pages còn dùng gateway này. Dữ liệu và khả năng phục vụ API vẫn phụ thuộc backend đó; đổi hostname không phải chuyển quyền sở hữu D1 sang tài khoản Cloudflare của chủ repo.

Tài liệu chính thức: [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/), [Pages advanced mode](https://developers.cloudflare.com/pages/functions/advanced-mode/).

## Kiểm thử bản chuẩn bị

Ngày 15/10: 20 kiểm tra Node/SQLite + gateway đều pass; bản Pages build thành công và Worker biên dịch được bằng Wrangler 4.92.0. API chạy qua Pages runtime cục bộ tới backend D1 thật đã pass (consent, duplicate signup, tenant isolation, optimistic writes, feedback, CSV và reviewer). UI qua Pages đã pass đăng ký, sync tour/portal, yêu cầu tư vấn, công việc và phản hồi trên desktop/mobile; không có lỗi JS hoặc tràn ngang, phục hồi lỗi mạng và request chậm hoạt động. Tài khoản QA được dọn sau test. Backend live từ chối chữ ký gateway giả. Kiểm thử bằng runtime dùng compatibility date 2026-05-15 phù hợp với bản Wrangler đã ghim; không khai báo ngày mới hơn runtime hỗ trợ.

Production Pages đã trả HTTPS 200 cho HTML/API, và bộ kiểm thử API trên URL chính đã pass, dùng cùng database D1. UI production đã pass toàn bộ luồng đăng ký → tour/portal → tư vấn → công việc → phản hồi, màn hình desktop/mobile và giao diện reviewer chỉ đọc; không có lỗi JS/tràn ngang. Không dùng số tài khoản QA làm kết quả khảo sát CP3. Bài kiểm tra UI đã được sửa để chờ route mô phỏng mạng chậm hoàn thành trước khi chuyển trang, tránh lỗi của script khi mạng production có độ trễ. TLS của hostname deployment cũng đã kiểm tra lại thành công sau thời gian cấp chứng chỉ ban đầu.
