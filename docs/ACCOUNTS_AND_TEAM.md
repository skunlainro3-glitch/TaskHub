# Tài khoản và không gian làm việc chung

`server/accounts.mjs` chứa hai phần độc lập: đặt lại mật khẩu và lời mời nhân viên. API được nối trong `server/index.mjs`. Xác minh email đã được xóa khỏi hàm xử lý và API; không có thư viện tài khoản mới.

## Quyền sử dụng

| Tài khoản | Dữ liệu | Quyền |
| --- | --- | --- |
| Người đăng ký dùng thử | Không gian riêng | Quản lý tour/công việc/B2B, mời nhân viên; log tester theo đồng ý. Khảo sát mới ở công cụ ngoài web. |
| Nhân viên `editor` | Không gian của người mời | Đọc/sửa nghiệp vụ thuộc bộ phận được cấp; không mời hoặc quản lý nhân viên |
| Nhân viên `viewer` | Không gian của người mời | Chỉ đọc/xuất trong phạm vi bộ phận; không phải vai nào cũng nhận tư vấn hoặc sổ B2B |
| Reviewer | Không gian agency được chỉ định | Chỉ xem và xuất dữ liệu đánh giá |
| Admin | Không gian agency | Điều hành và quản lý nhân viên |

Chủ không gian chọn bộ phận Kinh doanh/Điều hành/Kế toán/Quản lý và quyền xem/sửa. Ma trận chính xác trong `shared/access.mjs` và [bàn giao mentor](CP4_MENTOR_REVIEW.md) được áp dụng ở cả menu/API/export. Ví dụ Kinh doanh không đọc sổ B2B; Kế toán không đọc liên hệ tư vấn.

Người phụ trách công việc vẫn là tên nhập; chưa có thông báo hay gán tài khoản bắt buộc. MVP không chuyển tài khoản đã có sang không gian khác. Nếu email đã đăng ký không gian riêng, dùng email mới khi nhận lời mời; dữ liệu cũ được giữ nguyên.

Nhân viên không tham gia thống kê người thử, phản hồi khảo sát hoặc log nghiên cứu. Lịch sử B2B vẫn ghi đúng người sửa để đối soát nghiệp vụ.

## Mời nhân viên

Chủ không gian nhập email, bộ phận và quyền, sau đó tự sao chép liên kết riêng gửi đúng người nhận. Đây là liên kết bí mật; không đưa lên tài liệu công khai. Link có hạn 7 ngày, chỉ nhận một lần, phải nhập đúng email được mời. Tạo lời mời mới cùng email sẽ vô hiệu hóa lời mời cũ. Không có tài khoản nào được tự tạo khi chỉ bấm nút tạo lời mời.

Chủ không gian có thể đổi quyền hoặc xóa nhân viên. Quyền được đọc lại ở mỗi yêu cầu API. Nhân viên tự xóa tài khoản chỉ xóa chính tài khoản đó; tour, chủ không gian và nhân viên khác được giữ. Chủ tài khoản dùng thử tự xóa sẽ xóa toàn bộ không gian cùng các nhân viên của mình; giao diện phải giải thích rõ trước khi xác nhận.

## Đặt lại mật khẩu

Cấu hình môi trường khi có nhà cung cấp gửi thư:

```dotenv
PUBLIC_APP_URL=https://taskhub-travel.pages.dev
MAIL_API_URL=https://YOUR-MAIL-ENDPOINT
MAIL_API_TOKEN=PRIVATE-SERVER-SECRET
MAIL_FROM=YOUR-VERIFIED-SENDER
```

Adapter gọi HTTPS POST với Bearer token và JSON `{from,to,subject,text}`. Nhà cung cấp phải nhận đúng cấu trúc này hoặc có endpoint chuyển đổi tương ứng. Không giả định một tài khoản Gmail sẵn có là dịch vụ gửi thư cho ứng dụng. Không đưa token, email người nhận hoặc nội dung thư vào log.

Khi chưa cấu hình, API trả `mail_ready:false`, giao diện giải thích chưa gửi được email. API công khai không trả mã hay link khôi phục; tính năng tạo lời mời thủ công vẫn hoạt động. `PUBLIC_APP_URL` mặc định là tên miền Pages hiện có ở production và localhost:5173 ở local; nên cấu hình rõ khi triển khai sang tên miền khác.

Token ngẫu nhiên 32 byte, chỉ lưu SHA-256 trong database. Link đặt lại mật khẩu có hạn 30 phút và chỉ dùng một lần; đổi mật khẩu xóa mọi phiên đăng nhập của tài khoản và các token cũ. Yêu cầu gửi thư có giới hạn IP và khoảng cách một phút cho từng tài khoản. Câu trả lời quên mật khẩu không tiết lộ email có tồn tại hay không.

Admin/reviewer được cấu hình bằng biến môi trường, không đổi mật khẩu qua đường khôi phục email. Khi cần thay, chủ triển khai phải cập nhật bí mật môi trường. Vẫn phải tuyển người thử thật và ghi nhận đúng cách dùng; email tự nhập không tự chứng minh danh tính.

## Database và kiểm thử

Bốn bảng mới `account_profiles`, `account_tokens`, `workspace_members`, `workspace_invites` được thêm độc lập; không đổi cấu trúc chín cột ban đầu của `users`. Token và lời mời hết hạn được dọn; quy tắc 180 ngày xóa nhân viên riêng lẻ, không dùng ngày đăng ký nhân viên để xóa không gian chung. Khi chủ không gian hết thời hạn lưu dữ liệu, toàn bộ không gian của chủ vẫn được dọn theo chính sách đã công bố.

`account_profiles` và giá trị mục đích token cũ chỉ còn trong schema/migration lịch sử để giữ nguyên dữ liệu đã triển khai. Không còn reader/writer xác minh email trong ứng dụng; không sửa hoặc xóa migration cũ để bỏ một chức năng.

`tests/accounts.test.mjs` kiểm tra link hết hạn/một lần, reset đồng thời, không lộ token, trạng thái thiếu email provider, lời mời theo email, nhận mời đồng thời, phân quyền API, tách dữ liệu nghiên cứu và xóa tài khoản an toàn trên SQLite/libSQL.
