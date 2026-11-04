# Bàn giao An — câu hỏi đánh giá MVP sau dùng thử

Phiên bản: **CP3-2026.10.18**. Câu hỏi chuẩn nằm trong [CP3_SURVEY.json](CP3_SURVEY.json), đồng thời được trình bày trong Google Sheet bàn giao. Không lấy dữ liệu CP2 hoặc QA làm phản hồi CP3.

Google Sheet: https://docs.google.com/spreadsheets/d/1XIxCvvugUuCl5WWhBqr4IGw6QAHdjacWjRXlexywZlY/edit. Đã đối chiếu quyền ngày 18/10: tài khoản Google anh cung cấp cho An hiện là chủ sở hữu và có quyền chỉnh sửa đầy đủ; bảng raw không bật quyền công khai. Tệp đã có 6 tab, múi giờ Việt Nam và kiểm tra nhập điểm 1–5; không có phản hồi điền sẵn.

## Cách triển khai

1. Tuyển trên 20 người để dự phòng; nhóm phải xác nhận ít nhất 20 **cá nhân**, ưu tiên điều hành/Sales/quản lý doanh nghiệp lữ hành. Ghi nguồn tuyển và giới hạn mẫu thuận tiện.
2. Cho người tham gia xem hoặc tự dùng các chức năng. Ba luồng cốt lõi: portal, giao việc, lịch/số chỗ. B2B và Excel chỉ đánh giá nếu người đó đã xem/thử; có lựa chọn chưa thử/không áp dụng.
3. Đọc thông báo đồng ý trước khi thu email. Không đồng ý: dừng và không thu phần sau. Không công khai bảng có email hoặc cấp quyền chỉnh sửa chung cho người tham gia.
4. An có thể chuyển bảng câu hỏi thành Google Forms, hoặc phỏng vấn và ghi ngay vào các tab raw của Sheet. Mỗi tester một dòng ở `Raw_testers`; mỗi tính năng đã đánh giá một dòng ở `Raw_features`. Không điền sẵn người thử/điểm/nhận xét.
5. Đối chiếu email với log có quyền truy cập. Giữ khác biệt giữa tự dùng và xem demo; không kết luận người không có log chắc chắn chưa xem MVP.

## Bộ 12 câu

| Mã | Nội dung | Dạng trả lời |
| --- | --- | --- |
| Q1 | Đồng ý tự nguyện theo thông báo dữ liệu? | Đồng ý/Không đồng ý; từ chối thì dừng. |
| Q2 | Email đã dùng để thử TaskHub? | Email, không coi là xác minh danh tính. |
| Q3 | Vai trò hiện tại? | Điều hành; Sales/Marketing; quản lý/chủ doanh nghiệp; khác. |
| Q4 | Quy mô đơn vị? | 1–9; 10–30; 31–50; trên 50; không áp dụng. |
| Q5 | Đã tự dùng hoặc xem trình diễn những chức năng nào? | Nhiều lựa chọn; phân biệt tự dùng/xem demo. |
| Q6 | Hoàn thành từng thao tác đến đâu? | Tự hoàn thành; cần trợ giúp; chưa hoàn thành; chỉ xem; chưa thử. |
| Q7 | Tầm quan trọng của từng chức năng? | 1–5 và không áp dụng/chưa thử. |
| Q8 | Có dự định dùng từng chức năng trong công việc? | Có; cân nhắc; không; không áp dụng/chưa thử. |
| Q9 | Mức dễ/khó của từng chức năng đã tự thao tác? | 1 rất khó–5 rất dễ; chưa tự thử. |
| Q10 | Điều gì hữu ích nhất? | Mở, không bắt buộc. |
| Q11 | Khó khăn/lỗi/điểm không thích, kèm thao tác cụ thể? | Mở, không bắt buộc. |
| Q12 | Mức phí tháng sẵn sàng đề xuất? | VND nguyên, 0 hợp lệ; chưa xác định/không quyết định ngân sách được để trống. |

Danh sách tính năng, bước thử và giới hạn từng luồng nằm trong JSON/Sheet; không hỏi về booking, thanh toán, tự gửi email hoặc đối tác tự duyệt như thể chúng đã được triển khai.

## Thông báo đồng ý

Nhóm TaskHub thu email, vai trò, quy mô doanh nghiệp, phản hồi và thao tác thử MVP để đánh giá CP3. Tham gia tự nguyện; bạn có thể dừng. Dữ liệu chỉ dành cho nhóm và giảng viên, không công khai email; lưu tối đa khoảng 6 tháng. Không nhập dữ liệu khách hàng thật. Có thể xóa tài khoản/dữ liệu trong Tài khoản & nhóm của MVP; với bản khảo sát/CSV đã xuất, liên hệ người mời khảo sát để yêu cầu xóa. Bạn đồng ý tham gia không?

## Đối chiếu dữ liệu

### Quy ước khi xuất CSV để tổng hợp

Lưu mốc consent/thử/đánh giá theo ISO có múi giờ, ví dụ dạng `YYYY-MM-DDTHH:mm:ss+07:00` hoặc `...Z`; không nhập ngày mơ hồ như 18/10 rồi bỏ giờ. `consent_version` dùng `CP3-2026.10.18`. Trường thời gian bắt đầu/kết thúc có thể trống nếu chưa ghi, không tự đoán.

- `feature`: `portal`, `operations`, `sync`, `pooling`, `import`, `quick_actions` hoặc đúng tên tính năng trong tab Tinhnang.
- `mode`: `self`/Tự dùng hoặc `demo`/Xem demo.
- `result`: `completed`/Tự hoàn thành, `assisted`/Cần trợ giúp, `incomplete`/Chưa hoàn thành, `viewed`/Chỉ xem demo, `untried`/Chưa thử. Người chỉ xem demo để trống điểm dễ dùng.
- `importance`, `ease`: 1–5 hoặc trống; không điền 0 để chỉ chưa thử. `intent`: `yes`/Có, `maybe`/Cân nhắc, `no`/Không, `na`/Không áp dụng.
- `monthly_price_vnd`: số nguyên VND không có phân cách hàng nghìn; 0 hợp lệ. Nếu có giá trị, `price_status` dùng `provided` hoặc để trống; nếu chưa xác định/không quyết định ngân sách thì để số tiền trống, ghi trạng thái riêng.

`npm run survey:report -- Raw_testers.csv Raw_features.csv thu-muc-bao-cao` tạo báo cáo riêng cho cả 6 nhóm chức năng. Dòng Raw_testers trùng email: giữ dòng cuối CSV, nên không đổi thứ tự các phiên cập nhật trước khi xuất. Raw_features trùng email/tính năng: giữ observed_at mới nhất, cùng mốc thì dòng cuối; bản mới sai được báo lỗi thay vì lấy lại câu trả lời cũ. Báo cáo không xác minh 20 người thật hoặc tự chọn giá. Xem [quy trình hoàn tất](CP3_CLOSEOUT.md).

- Log UI: `ui_click`/`ui_change`; mã nút, khu vực, thời gian thiết bị nằm trong `entity`; `created` là thời gian server. Không lưu nội dung gõ hoặc mật khẩu. Khi mất mạng, log có thể thiếu.
- Log nghiệp vụ xác nhận tour/việc/phiếu thực sự được lưu. Không dùng số click để kết luận luồng hoàn tất hoặc để đếm người thật.
- Bản app 0.4 từng thu 6 nhóm tính năng; từ 0.7.2 form và API gửi đánh giá đã gỡ. Nhóm thu mới bằng khảo sát bên ngoài, giữ riêng các thang đo và đợt thử. Không tự chuyển điểm hữu ích ba tính năng cũ thành điểm quan trọng/dễ dùng theo tính năng.
- Quản trị/reviewer vào **Tài khoản & nhóm → Dữ liệu kiểm thử**, mở **Bản xuất khảo sát đã lưu** để tải CSV Người thử/Đánh giá tính năng lịch sử khi được cấp quyền. Chúng dùng schema Raw_testers/Raw_features cho `survey:report`; CSV phản hồi bản trước dành cho `research:report`. Không cộng số email ở hai nguồn để đếm cá nhân hoặc dùng dữ liệu lịch sử như phản hồi mới.
- Sheet/CSV raw giữ riêng; repo chỉ chứa câu hỏi, hướng dẫn và schema trống. Nhóm đọc ý kiến mở, nêu cỡ mẫu từng tính năng rồi mới quyết định giá và Iterate/Persevere.
