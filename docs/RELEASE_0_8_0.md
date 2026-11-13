# TaskHub 0.8.0 — báo giá và công việc dùng lại

Ngày: **09/11/2026**. Phạm vi: frontend, backend, triển khai và bàn giao. Đợt này bổ sung ba luồng giúp giảm việc nhập lặp; không thay bằng chứng khảo sát hoặc phần trình bày của nhóm.

## Trạng thái kiểm tra và phát hành

| Phần | Trạng thái tại lúc soạn bàn giao |
| --- | --- |
| Kiểm tra tự động SQLite | 128/128 đạt. |
| Kiểm tra tự động libSQL | 128/128 đạt. |
| Trình duyệt: báo giá | Đạt; đã thử bản duyệt, bản sửa, quyền, Excel/PDF và giữ nội dung đã chốt khi tour thay đổi. |
| Trình duyệt: mẫu công việc / Việc của tôi | Đạt; thử tạo/sửa/ngừng dùng, hạn theo ngày đi, gửi lặp, xung đột và lọc đúng tài khoản ở 320/390/768/1440px. |
| Hồi quy giao diện | 7 bộ kiểm thử cũ đạt; cập nhật nhãn trường nhập tên và bước báo giá trong quy trình. |
| Worker/D1 local | Hai bộ trình duyệt báo giá và mẫu công việc đều đạt trên bản Worker thực tế. Migration 0006 không đổi dữ liệu cũ; xóa nhân viên giữ nguyên tên công việc. |
| CI, commit phát hành | Commit tính năng `66b2b257095fd525c44bc932f3ce8bc2b76cb9c9`; CI push `42506881237` và CI PR `42506940336` đều đạt. [PR #9](https://github.com/skunlainro3-glitch/TaskHub/pull/9) chờ chủ repo duyệt vào `main`. |
| Website public | Đã triển khai và kiểm tra tại https://taskhub-travel.pages.dev/; hai bộ browser mới và cloud API đều đạt. Tài khoản QA đã xóa. Metadata deployment trong `cloud/`. |
| Dữ liệu nhóm | Đối chiếu trước/sau khớp toàn bộ trường nghiệp vụ cũ: 3 tour, 3 việc, 3 B2B, 2 yêu cầu và 7 lịch sử B2B. |

Đọc [VALIDATION](VALIDATION.md) và metadata trong `cloud/` để đối chiếu chứng cứ phát hành. Tag `v0.8.0` cố định mã tính năng đã kiểm tra; tag không khóa dữ liệu live. Các tag 0.7.3, trong đó có `cp4-demo-v0.7.3-final`, giữ nguyên làm dự phòng; không chuyển tag cũ sang commit mới.

Nhóm sửa và push lên **`dev`**, sau đó mở PR **`dev` → `main`** để chủ repo duyệt. `main` là nhánh chính, mặc định và được bảo vệ. Nhãn production `dev` của Pages là nhãn hosting riêng, không quyết định nhánh Git được phát hành.

## 1. Báo giá theo số khách, có người duyệt

Vào **Báo giá** → **Tạo báo giá**. Chọn một tour có sẵn, nhập người nhận, số khách, đơn giá, giảm giá cho cả đoàn, ngày hết hiệu lực và ghi chú cần thiết. Email người nhận không bắt buộc.

Tổng báo giá = số khách × giá một khách − giảm giá cả đoàn. Tiền dùng số nguyên VND; không cho giảm vượt tạm tính. Không tự thêm VAT, phụ thu, hoa hồng hoặc điều kiện dịch vụ mà nhóm chưa cung cấp.

1. **Lưu bản nháp** để kiểm tra thông tin.
2. Mở chi tiết, chọn **Gửi duyệt**. Bản đang chờ không được sửa trực tiếp; cần rút về nháp trước.
3. Người có quyền duyệt kiểm tra rồi duyệt hoặc yêu cầu sửa. Yêu cầu sửa phải có lý do.
4. Chỉ bản **Đã duyệt** mới xuất **Excel** hoặc **In / lưu PDF**. PDF dùng hộp thoại in của trình duyệt, chọn **Lưu dưới dạng PDF**.
5. Muốn sửa bản đã duyệt, mở lại nháp, sửa và gửi duyệt lại; trạng thái duyệt cũ không được giữ cho nội dung mới.

| Người dùng | Phạm vi |
| --- | --- |
| Chủ không gian | Tạo, sửa và duyệt; có thể tự duyệt bản của mình với bước xác nhận rõ ràng và ghi lịch sử. |
| Nhân viên Kinh doanh / Tổng hợp được cấp quyền sửa | Tạo, sửa nháp và gửi duyệt; không duyệt. |
| Nhân viên Quản lý được cấp quyền sửa | Tạo và duyệt; không tự duyệt báo giá do chính mình tạo. |
| Nhân viên Điều hành | Xem báo giá theo quyền; không tự có quyền tạo hoặc duyệt. |
| Người chỉ xem / người đánh giá | Xem và xuất bản đã duyệt theo phạm vi được cấp; không đổi nội dung hoặc trạng thái. |
| Nhân viên Kế toán | Không tự được xem thông tin người nhận báo giá từ vai trò kế toán. |

Báo giá giữ bản chụp thông tin tour và các điều khoản tại lúc soạn. Việc sửa giá/tên tour sau đó không âm thầm đổi bản đã duyệt; lịch sử ghi người thao tác, thời gian, phiên bản và nội dung tương ứng. Bản đã lưu vẫn giữ thông tin tour khi tour nguồn bị xóa.

**Phân biệt hai loại xuất:** các nút trong **chi tiết tour** cũ xuất thông tin công khai và giá một khách. Mục **Báo giá** mới là tài liệu có người nhận, số khách, tổng tiền và quy trình duyệt; dữ liệu này chỉ nằm trong điều hành. Cả hai đều không giữ chỗ, không tạo booking, không tự gửi email và không xác nhận thanh toán.

### Thử nhanh báo giá

Dùng workspace QA riêng và thông tin giả được gắn nhãn. Tạo bản nháp → thử xuất trước duyệt (phải bị chặn) → gửi duyệt → duyệt bằng người được phép → tải Excel và lưu PDF. Đổi tên/giá tour nguồn rồi mở lại báo giá: nội dung đã chốt phải giữ nguyên. Mở lại nháp để sửa: nút xuất phải chờ duyệt lại. Mở hai tab cùng phiên bản, lưu một tab rồi thao tác tab còn lại: nhận thông báo xung đột và tải lại, không ghi đè.

## 2. Bộ mẫu công việc theo tour

Vào **Công việc** → **Mẫu công việc** → **Tạo bộ mẫu**. Nhóm tự nhập tên bộ mẫu và các việc thực sự cần làm, tối đa 20 việc mỗi mẫu. Không có quy trình kinh doanh tự điền sẵn.

Mỗi việc có nội dung, ưu tiên, tài khoản phụ trách tùy chọn và mốc ngày so với ngày khởi hành:

- Mốc âm: trước ngày khởi hành.
- Mốc `0`: đúng ngày khởi hành.
- Mốc dương: sau ngày khởi hành.

Sau khi lưu, chọn **Dùng cho tour**, chọn tour và người phụ trách mặc định cho các việc chưa có người. Bấm **Xem trước công việc** để kiểm tra hạn/người phụ trách, rồi xác nhận tạo danh sách. Việc chưa chọn người được ghi rõ **Chưa phân công**.

Mỗi lần áp dụng có mã riêng. Gửi lại cùng mã sau lỗi mạng không tạo thêm việc lần hai. Nếu đã tạo nhưng chưa thấy phản hồi, tải lại danh sách để kiểm tra trước khi mở một lần áp dụng mới. Chủ động dùng lại mẫu ở một lần khác sẽ thêm một bộ việc mới; không tự thay hoặc xóa việc đang có.

Sửa bộ mẫu không sửa ngược những công việc đã sinh. **Ngừng dùng** ẩn mẫu khỏi danh sách đang dùng và giữ nguyên công việc đã tạo. Nếu tour, bộ mẫu hoặc người phụ trách đã thay đổi từ lúc xem trước, hệ thống yêu cầu tải lại và kiểm tra.

Người có quyền sửa công việc mới được tạo/sửa/ngừng dùng/áp dụng mẫu. Mẫu không tự tạo hợp đồng, tự chạy khi tour khởi hành hoặc gửi thông báo cho nhân viên.

### Thử nhanh bộ mẫu

Trong workspace QA, tự tạo một mẫu nhỏ với các mốc ngày khác nhau → áp dụng cho tour thử → đối chiếu hạn xem trước với các việc đã tạo. Gửi lại cùng lần tạo: số việc không được tăng. Sửa hoặc ngừng dùng mẫu: các việc cũ phải giữ nguyên. Dùng hai tab sửa cùng mẫu để thử thông báo xung đột. Không đưa các việc QA vào workspace nghiệp vụ của nhóm.

## 3. Tài khoản phụ trách và “Việc của tôi”

Khi tạo/sửa công việc, chọn **Tài khoản phụ trách** từ những người đang thuộc cùng không gian. Công việc gắn với mã tài khoản, không suy luận theo tên.

Vào **Công việc**, bật **Việc của tôi** để chỉ xem việc có mã người phụ trách đúng bằng tài khoản đang đăng nhập. Vẫn kết hợp được tìm kiếm, lọc tour, hạn và ưu tiên. Hai người trùng tên không được coi là cùng một người.

Tên phụ trách nhập tay từ dữ liệu cũ vẫn giữ nguyên. Các việc đó không tự xuất hiện trong “Việc của tôi”; người có quyền cần mở việc và chọn tài khoản cụ thể. Nhân viên bị thu hồi không được chọn cho việc mới; việc cũ giữ tên để đối chiếu. Bộ lọc này giúp tìm việc, không thay đổi quyền xem/sửa của vai trò và không tự gửi thông báo.

### Thử nhanh “Việc của tôi”

Dùng hai tài khoản QA cùng workspace. Giao một việc bằng tài khoản A và một việc bằng tài khoản B → đăng nhập từng người → bật bộ lọc và kiểm tra đúng việc của người đó. Thêm một việc chỉ nhập tên giống A: việc này không tự được tính là của A. Không chọn được người từ workspace khác.

### Chọn người phụ trách — cập nhật 13/11/2026

Mỗi công việc có một tài khoản phụ trách. Danh sách chỉ gồm người đã nhận lời mời vào cùng không gian. Nếu chỉ có tên chủ, vào **Tài khoản & nhóm** để mời nhân viên, chờ họ nhận lời mời rồi bấm **Tải lại người phụ trách** trong form giao việc. Việc tải lại giữ nội dung đang nhập.

Tên người nhận hiển thị kèm bộ phận trong cả công việc và bộ mẫu. Chủ không gian thấy thêm nhãn **chỉ theo dõi** cho nhân viên chỉ xem hoặc vai trò không có quyền sửa công việc. Người được giao cần vai trò hỗ trợ sửa công việc và quyền **Được sửa** để tự cập nhật trạng thái. Kế toán ghi nhận thu B2B theo quyền riêng. Tên nhập tay vẫn chỉ dùng để theo dõi và chưa liên kết với tài khoản.

## Giá/gói và các phần chưa triển khai

Ở mốc phát hành 0.8.0, màn **Giá trị & doanh thu** nội bộ có thêm lựa chọn mẫu công việc và báo giá để soạn phương án gói. Màn này cùng API kế hoạch hiện đã được gỡ theo yêu cầu chủ dự án. Nhóm chuẩn bị giá/gói, giá trị, BMC và P&L trong tài liệu, slide và bảng tính riêng. Website chưa khóa/mở tính năng theo Standard/Pro/Premium, chưa tính phí hoặc tự áp hạn mức tài khoản theo giá.

Chưa triển khai QR thanh toán, tùy chỉnh thương hiệu riêng, tự tính/chia hoa hồng hoặc cam kết hỗ trợ dưới 30 phút. Không dùng tài liệu kinh doanh để ghi các phần này là đã có. Các số tiết kiệm thời gian cần đo bằng người dùng thật; bản QA không phải kết quả khảo sát.

## Chạy local và bàn giao mã

Lưu phần đang sửa trước khi cập nhật code. Với bản đã clone:

```powershell
git switch dev
git pull --ff-only origin dev
npm ci
npm run dev
```

Dùng Node.js 24 trở lên, cấu hình `.env` theo [README](../README.md) và mở http://127.0.0.1:5173. Dữ liệu local tách khỏi public. Không chép `.env`, tài khoản, báo giá có thông tin cá nhân hoặc database vào Git.

Các tệp chính: `src/quotes-ui.jsx`, `shared/quotes.mjs`, `server/quotes.mjs`; `src/task-templates-ui.jsx`, `shared/task-templates.mjs`, `server/task-templates.mjs`; `server/productivity-schema.sql` và migration D1 thêm mới trong `cloud/drizzle/`. Xem [hướng dẫn mã nguồn](CODE_GUIDE.md) để sửa ở repo gốc rồi xuất sang cloud.
