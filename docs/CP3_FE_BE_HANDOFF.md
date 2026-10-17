# Bàn giao FE/BE TaskHub cho CP3

Ngày rà soát: 17/10/2026. Phạm vi Tuấn: FE/BE, vận hành, dữ liệu hỗ trợ kiểm thử và tài liệu demo. Không điền thay slide, BMC, quyết định giá hoặc kết luận khảo sát của thành viên khác.

- Web: https://taskhub-travel.pages.dev/
- Code nhóm làm việc: https://github.com/skunlainro3-glitch/TaskHub/tree/build
- Nhánh `dev` giữ để chủ repo duyệt sau. Thay đổi tổng hợp đang ở PR #4.

## 1. Uses — Chức năng và giới hạn

| Nhu cầu | Luồng đã có | Giới hạn phải trình bày đúng |
| --- | --- | --- |
| Thông tin tour tập trung | Tạo, sửa, xóa tour; nhập lịch trình, giá, sức chứa và số khách giữ chỗ; chủ động công khai | Không tự lấy dữ liệu từ đối tác. Tour mới trống và chưa công khai. |
| Khách tra cứu ngoài giờ | Cổng tour công khai, tìm/lọc, xem lịch trình/giá/số chỗ, gửi yêu cầu tư vấn | Yêu cầu không giữ chỗ, xác nhận booking, thanh toán hoặc tự gửi email. Không có chatbot. |
| Theo dõi điều hành | Công việc gắn tour, tên phụ trách, hạn, ưu tiên và trạng thái | Chưa có tài khoản từng nhân viên, thông báo giao việc hoặc không gian cộng tác nhiều nhân viên. Tên người phụ trách do người dùng nhập. |
| Dữ liệu phục vụ CP3 | Consent, vai trò/quy mô tự khai, lịch sử thao tác, feedback, CSV có quyền xem, công cụ tổng hợp offline | Không xác minh email, người thật hay mẫu đại diện. Không tạo người thử hoặc kết luận thị trường. |

## 2. Specs — Có thể chứng minh bằng hệ thống

FE React/Vite; local Node.js 24 + SQLite. Public dùng Cloudflare Pages và gateway ký yêu cầu tới backend Workers/D1 đã có. Dữ liệu nằm trên cloud, không phụ thuộc việc máy của chủ repo bật hay tắt. Không cần người dùng tự cài ứng dụng để truy cập web.

- Cổng và điều hành đọc cùng nguồn dữ liệu; tải nền mỗi 5 giây khi tab đang hiển thị. Đây là polling, không phải cập nhật tức thời bằng WebSocket.
- Kiểm tra số khách không vượt sức chứa; kiểm tra phiên bản khi sửa/xóa để tránh ghi đè thay đổi mới hơn.
- Tách workspace; chỉ công khai tour đã chọn công khai. Không công khai email, yêu cầu tư vấn hoặc công việc nội bộ.
- Cookie phiên HttpOnly/SameSite và Secure khi production; mật khẩu băm bằng scrypt, giới hạn tần suất và kiểm tra origin cho thao tác ghi.
- API timeout và thông báo thử lại khi lỗi mạng; không tự gửi lại thao tác ghi.
- Có kiểm thử đồng thời, lưu sau restart/redeploy, phân quyền và xóa dữ liệu. Kết quả QA chỉ chứng minh các tình huống đã thử, không chứng minh SLA, tải thương mại hoặc 20 người khảo sát.

## 3. Interface và Packaging

Web tiếng Việt, xanh dương nhạt, responsive; đã kiểm tra ở 320/390/768/1440 px. Điều hành có Tổng quan, Quản lý tour, Công việc, Yêu cầu tư vấn và Phản hồi MVP; hướng dẫn dùng thử nằm ngay tổng quan. Cổng khách hàng tách luồng đăng nhập/điều hành. Nội dung kinh doanh phải do nhóm/người quản lý cung cấp; không có tour, giá, nhân sự hoặc lời chứng thực tự tạo.

## 4. Chứng minh liên hệ với CP2 khi demo

| Pain trong CP2 | Thao tác trình diễn | Bằng chứng và điều chưa giải quyết |
| --- | --- | --- |
| P1: thông tin phân tán, khó theo dõi tiến độ | Tạo tour, cập nhật lịch/số chỗ, giao và đổi trạng thái việc | Tour và công việc nằm cùng workspace. Chưa tích hợp Zalo/Excel hoặc nhiều tài khoản nhân viên. |
| P2: khách hỏi ngoài giờ | Mở cổng khách hàng, tìm/xem tour, gửi yêu cầu và xem ở điều hành | Khách đọc dữ liệu đã công khai. Chưa đo số khách giữ được hoặc doanh thu tăng. |
| P3: sai lệch khi ghép tour giữa doanh nghiệp | Chỉ trình bày nền tảng lịch/số chỗ chung hiện có | Chưa có đối soát công nợ, phân quyền đối tác hoặc xác nhận dịch vụ B2B đầy đủ. Không tuyên bố đã hoàn thành toàn bộ giải pháp P3. |

PDF yêu cầu chứng minh MVP đáp ứng giải pháp CP2 khi demo trực tiếp. Nhóm cần giải thích giới hạn phạm vi bản đầu; không dùng giao diện hiện tại làm bằng chứng B2B đã hoàn chỉnh.

## 5. Kịch bản demo trực tiếp

Chuẩn bị trước: nhóm nhập/duyệt dữ liệu tour để dùng trong demo; chọn tài khoản dùng thử riêng và giữ một cửa sổ cổng khách hàng. Không dùng tài khoản reviewer để chỉnh dữ liệu. Không đưa CSV có email vào màn chiếu công khai.

1. Giới thiệu người dùng mục tiêu: điều hành/Sales tại doanh nghiệp lữ hành 10–50 nhân sự, theo báo cáo CP2.
2. Vào Quản lý tour, tạo tour bằng thông tin nhóm chuẩn bị; kiểm tra rồi chọn công khai. Giải thích dữ liệu không tự tạo.
3. Mở lại tour, đổi lịch hoặc số khách giữ chỗ, lưu. Đổi sang cổng khách hàng và đợi chu kỳ cập nhật; đối chiếu thông tin.
4. Gửi yêu cầu tư vấn bằng dữ liệu thử được nhóm chuẩn bị, quay về điều hành để thấy yêu cầu. Nói rõ chưa phải xác nhận đặt tour.
5. Tạo việc gắn đúng tour, nhập người phụ trách/hạn, chuyển trạng thái. Nói rõ chưa có tài khoản hoặc thông báo tự gửi tới nhân viên đó.
6. Mở Phản hồi MVP và giải thích người thử tự đánh giá; quản trị/reviewer xuất dữ liệu gốc. QA dùng để trình diễn phải được tách khỏi khảo sát.
7. Nếu mạng gián đoạn: dùng thông báo lỗi/thử tải lại; không dùng ảnh hoặc video thay thế rồi gọi đó là demo live. Có thể chạy bản local bằng README và nói rõ môi trường đang dùng.

Phần chức năng, giải quyết pain và UI/UX được yêu cầu trình diễn trực tiếp trong PDF; không tự biến các phần này thành slide thay thế demo.

## 6. Giá, lợi thế và hỗ trợ — những gì được phép nói

- Giá: chưa có mức bán đã chốt. Mức 500.000 VND/tháng trong CP2 là giả định kịch bản. Tool mới tính thống kê willingness-to-pay từ dữ liệu thật, không tự chọn giá hoặc dựng Price Map. Van Westendorp là phần nâng cao tùy chọn.
- Lợi thế có thể demo: thông tin tour và công việc theo ngành lữ hành dùng chung với cổng khách hàng. Chưa có thử nghiệm đối thủ để chứng minh tính độc nhất, chi phí chuyển đổi hoặc lợi thế thị trường.
- AI-proof: phần dữ liệu có phiên bản, quyền truy cập và thao tác điều hành đã có thể kiểm tra. Không có căn cứ khẳng định sản phẩm không thể bị AI thay thế; nhóm đối chiếu lập luận với CP1 trước khi trình bày.
- Hỗ trợ hiện tại: hướng dẫn trong app và mục Phản hồi MVP. Chưa được cung cấp email/kênh hỗ trợ công khai, người trực hoặc SLA; không tự thêm lời cam kết.

## 7. Checklist bàn giao

- [x] FE/BE public, địa chỉ cố định, dữ liệu cloud bền vững; giữ nhánh `build` cho nhóm và chưa merge `dev`.
- [x] Form dùng thử, consent, phản hồi, interaction logs, quyền xuất CSV, reviewer chỉ xem.
- [x] Công cụ tổng hợp CSV có kiểm tra dữ liệu, phân biệt QA/trùng/chưa đủ thao tác; không xuất email/nội dung tự do vào báo cáo tổng hợp.
- [x] Hướng dẫn tuyển người thử, xuất bản gốc, tạo báo cáo và demo trực tiếp.
- [ ] Nhóm cung cấp dữ liệu demo được duyệt, thông tin hỗ trợ và GitHub username nếu cần quyền push.
- [ ] Ít nhất 20 cá nhân thử thật, đối chiếu mẫu và phụ lục dữ liệu có email theo quyền xem.
- [ ] Nhóm chuyển thông tin reviewer và cấp quyền phụ lục cho Thanhntl2@fpt.edu.vn; có tài khoản không đồng nghĩa giảng viên đã nhận được quyền truy cập.
- [ ] Thành viên phụ trách hoàn thiện chiến lược/giá, Iterate/Persevere, BMC đúng một trang và slide.
- [ ] Nhóm trưởng xác nhận slot, hạn nộp chính thức. PDF quy định nộp trước slot tuần 7; mốc 21/10 và 23/10 là timeline nhóm đã cung cấp, không phải xác nhận booking.

Báo cáo AI riêng đã gỡ theo yêu cầu chủ dự án. Tiêu chí disclosure trong bài nộp là yêu cầu riêng của PDF/rubric; không bổ sung lại báo cáo đó vào web hoặc repo trong đợt này.

## 8. Các câu trả lời kỹ thuật cần nắm

1. Tắt máy chủ repo có mất web không? Không; FE và dữ liệu đang chạy trên cloud.
2. Vì sao thông tin chưa đổi ngay? Cổng cập nhật theo chu kỳ 5 giây khi tab hiển thị; còn phụ thuộc kết nối.
3. Hai lượt cùng sửa một tour thì sao? Lượt dùng phiên bản cũ bị từ chối, cần tải lại.
4. Gửi tư vấn có hết chỗ không? Không; đây chỉ là yêu cầu liên hệ, không phải booking.
5. Giao việc có gửi thông báo cho nhân viên không? Chưa; hiện lưu tên phụ trách và tiến độ.
6. 20 tài khoản có phải 20 người không? Không; cần nhóm đối chiếu cá nhân thực tế.
7. Vì sao một phản hồi chưa được đối chiếu đủ thao tác? Có thể thiếu sửa tour, xem cổng, tạo việc hoặc đổi trạng thái trước khi gửi. Tool nêu số bị loại; nhóm kiểm tra bản gốc.
8. Có thể lấy trung vị mức trả làm giá tối ưu không? Không; đây là mô tả mẫu, cần dữ liệu chi phí, cạnh tranh và quyết định của nhóm.
9. Giảng viên sửa được dữ liệu không? Reviewer chỉ xem/xuất, không có quyền chỉnh dữ liệu.
10. Xóa tài khoản có xóa hết file đã tải không? Không; nhóm phải quản lý/xóa riêng CSV, backup và bản chia sẻ.
