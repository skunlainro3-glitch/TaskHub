# TaskHub đã chạy trên cloud — 15/10/2026

Web công khai cho người dùng: https://taskhub-travel.pages.dev/

Backend Sites / URL cũ: https://taskhub.ninaninohihi.chatgpt.site. Pages dùng gateway có chữ ký tới API này và cùng D1; giữ backend hoạt động. Xem [vận hành Pages](PAGES_DEPLOYMENT.md).

FE/BE chạy trên hosting Sites (Cloudflare Workers); dữ liệu nằm trong D1 binding `DB`. Web không dùng tunnel, không gọi localhost của chủ repo, không cần máy anh bật. Đây là MVP để thử nghiệm CP3; tour/giá là dữ liệu mẫu, tư vấn chưa phải booking hay thanh toán.

`taskhub` là tên ứng dụng; `ninaninohihi` là namespace tài khoản Sites đã kết nối; `chatgpt.site` là domain của hosting. Muốn đổi thành một domain riêng như `taskhub.vn` cần sở hữu domain phù hợp và cấu hình DNS theo hướng dẫn custom domain của Sites. Chưa mua domain hoặc nâng gói trả phí.

## Chạy và sửa code

Team clone nhánh `build`, dùng Node.js 24, `npm ci`, `npm run dev`, mở http://127.0.0.1:5173. Bản local vẫn dùng SQLite; cloud có database riêng. Dữ liệu local/CP2 không được tự chuyển lên cloud. `.env`, database, CSV và secrets không nằm trong Git.

`src/main.jsx`, `src/styles.css`, `server/index.mjs`, `server/db.mjs` là nguồn FE/BE chính. `scripts/export-sites.mjs` tạo UI và API cho checkout Sites đã chuẩn bị; adapter dùng D1 batch để ghi nguyên tử. Ghi tour có phiên bản; event chỉ ghi khi cập nhật thành công. Đăng ký trùng đồng thời không tạo workspace thừa. Không thay đổi stack chạy local của team.

## Phát hành bản tiếp theo

Chủ repo duyệt PR `build → dev` trước khi phát hành. GitHub và Sites có repository nguồn riêng: merge GitHub không tự deploy Sites.

1. Dùng lại checkout Sites hiện có tại `C:/Users/ACER/Documents/Codex/TaskHub-Cloud` trên máy chủ repo; giữ `.openai/hosting.json` và toàn bộ lịch sử `drizzle/`. ID/URL/version đang chạy được ghi trong `cloud/site.json`; không tạo Site/database mới chỉ để cập nhật.
2. Từ thư mục TaskHub, chạy `npm run cloud:export -- "C:/Users/ACER/Documents/Codex/TaskHub-Cloud"`.
3. Nếu đổi schema, sửa `cloud/schema.ts`, generate migration mới tại checkout Sites và sao chép SQL/metadata mới vào `cloud/drizzle/`. Không sửa migration đã áp dụng. Script export từ chối ghi đè lịch sử khác nhau.
4. Build và đóng gói qua skill Sites. Source helper chịu trách nhiệm commit/push source; lưu version từ đúng SHA và archive rồi deploy vào chính Site này. Không đẩy `.git`, `.dev.vars`, `.env`, database hoặc secrets vào archive. Secret runtime cấu hình bằng công cụ environment của Sites.
5. Chạy kiểm thử cloud, UI và persistence sau redeploy bằng dữ liệu QA; xóa các tài khoản QA của mình trước khi thu khảo sát thật. Không dùng 20 request tự động thay cho 20 cá nhân.

Trên Windows của máy này, helper cần dùng Git Bash trong PATH và `TAR_OPTIONS=--force-local` để đóng gói đường dẫn C:. Npm helper dùng shim trong `.sites-runtime/bin` trỏ tới npm CLI chính thức; đây là cấu hình checkout riêng, không đổi hệ thống và không đưa lên GitHub.

## Tài khoản và dữ liệu

Tester chọn **Dùng thử MVP**, tự đăng ký/đồng ý và có không gian mẫu riêng. Admin và reviewer được cấu hình bằng secret runtime. Chủ repo giữ bản cấu hình private ở `work/public-preview/.env` trên máy để đọc thông tin đăng nhập; không public file đó. Reviewer chỉ xem và xuất báo cáo, không sửa dữ liệu. Gửi thông tin reviewer cho giảng viên qua kênh riêng.

Email tester do họ tự nhập, chưa được xác minh. API xuất CSV có phân quyền; nhóm giữ dữ liệu gốc ở phụ lục riêng giới hạn người xem. Xóa dữ liệu quá 180 ngày khi API được sử dụng; middleware kiểm tra cleanup tối đa mỗi 12 giờ hoạt động của isolate. Việc này không xóa CSV/backup bên ngoài ứng dụng; nhóm quản lý và xóa riêng các bản đó.

## Bằng chứng kiểm tra

- Build Worker và migration D1 thành công; public access đã được hosting xác nhận.
- API trên D1 local và URL cloud: consent, đăng ký trùng đồng thời, tenant isolation, giới hạn sức chứa/ngày, cập nhật phiên bản đồng thời, event đúng, feedback upsert/đủ thao tác, CSV an toàn công thức và reviewer chỉ xem đều đạt.
- UI trên URL cloud: đăng ký → sửa tour/portal → tư vấn → tạo/hoàn tất việc → phản hồi; màn hình 320/390/768/1440 px, mất mạng/tải lại, mạng chậm và reviewer đều đạt.
- Sau redeploy cùng Site/version, phiên, công việc và phản hồi QA vẫn còn; cookie HTTPS Secure/HttpOnly/SameSite. QA đã xóa. Bộ đếm trước bàn giao: 0 tester, 0 feedback, 0 interaction event.
